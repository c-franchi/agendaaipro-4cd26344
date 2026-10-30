import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(`${process.env.COMMERCE_TEST_MODULES||'/tmp/agendai-commerce-test/node_modules'}/package.json`);
const {PGlite}=require('@electric-sql/pglite');const db=new PGlite();
const owner='11111111-1111-4111-8111-111111111111',o='44444444-4444-4444-8444-444444444444';
await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${owner}'::uuid $$;CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{"email":"fixture@example.com"}'::jsonb $$;GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;INSERT INTO auth.users VALUES('${owner}');`);
for(const f of ['20260112163644_2110e58b-ebed-4d5a-96b7-b305eae99373.sql','20261028214548_commerce_checkout_orders.sql','20261029000100_commerce_vouchers.sql','20261030014834_voucher_lifetime.sql'])await db.exec(readFileSync(new URL('../supabase/migrations/'+f,import.meta.url),'utf8'));
await db.exec(`INSERT INTO business_orders(id,request_key,user_id,name,email,plan_type,module_plan,setup_cents,monthly_cents,stage) VALUES('${o}','${o}','${owner}','QA','fixture@example.com','essencial','agenda',25000,3990,'awaiting_payment');INSERT INTO vouchers(code,discount_type,discount_value,applies_to,commerce_enabled,max_uses,max_uses_per_user) VALUES('TEST','percentage',20,'setup_and_first',true,2,2);`);
const reserve=(kind,code='TEST',preview=false)=>db.query('SELECT (commerce_reserve_voucher($1,$2,$3,$4,$5)).*',[o,owner,kind,code,preview]);
assert.equal((await reserve('setup','TEST',true)).rows[0].due_cents,20000);
assert.equal((await db.query('SELECT * FROM commerce_voucher_reservations')).rows.length,0);
const a=(await reserve('setup')).rows[0];assert.equal(a.discount_cents,5000);assert.equal((await reserve('setup')).rows[0].id,a.id);
await assert.rejects(reserve('setup','OTHER'));
await db.query("UPDATE commerce_voucher_reservations SET session_id='cs_setup' WHERE id=$1",[a.id]);await db.exec(`UPDATE business_orders SET setup_session_id='cs_setup',livemode=false WHERE id='${o}'`);
const pay=(event,amount=20000)=>db.query("SELECT commerce_record_payment($1,$2,'setup','cs_setup',$3,'brl',false,'cus','pi',NULL)",[o,event,amount]);
await assert.rejects(pay('evt_bad',1));await pay('evt_setup');await pay('evt_setup');assert.equal((await db.query('SELECT * FROM voucher_uses')).rows.length,1);assert.equal((await db.query('SELECT current_uses FROM vouchers')).rows[0].current_uses,1);
await db.exec(`UPDATE business_orders SET stage='ready' WHERE id='${o}'`);const sub=(await reserve('subscription')).rows[0];assert.equal(sub.due_cents,3192);assert.equal(sub.months,1);
await db.query("UPDATE commerce_voucher_reservations SET session_id='cs_sub' WHERE id=$1",[sub.id]);await db.exec(`UPDATE business_orders SET subscription_session_id='cs_sub' WHERE id='${o}'`);await db.query("SELECT commerce_record_payment($1,'evt_sub','subscription','cs_sub',3192,'brl',false,'cus',NULL,'sub')",[o]);assert.equal((await db.query('SELECT * FROM voucher_uses')).rows.length,2);
await db.exec('SET ROLE authenticated');await assert.rejects(db.exec("INSERT INTO voucher_uses(voucher_id,user_email,original_amount,discount_amount,final_amount) SELECT id,'x',1,1,0 FROM vouchers"));await assert.rejects(db.exec("SELECT increment_voucher_uses('TEST')"));await assert.rejects(reserve('setup'));await db.exec('RESET ROLE');
// Fresh orders exercise fixed discounts, free setup, expired/unreviewed/scope limits.
for(const [i,scope,value,type,enabled,expired] of [[1,'setup',999,'fixed',true,false],[2,'monthly',10,'percentage',true,false],[3,'setup',10,'percentage',false,false],[4,'setup',10,'percentage',true,true]]){
 const id=`55555555-5555-4555-8555-${String(i).padStart(12,'0')}`;await db.query("INSERT INTO business_orders(id,request_key,user_id,name,email,plan_type,module_plan,setup_cents,monthly_cents,stage) VALUES($1,$1,$2,'QA','fixture@example.com','essencial','agenda',25000,3990,'awaiting_payment')",[id,owner]);await db.query("INSERT INTO vouchers(code,discount_type,discount_value,applies_to,commerce_enabled,expires_at) VALUES($1,$2,$3,$4,$5,$6)",['V'+i,type,value,scope,enabled,expired?'2020-01-01':null]);
 const call=()=>db.query("SELECT (commerce_reserve_voucher($1,$2,'setup',$3)).*",[id,owner,'V'+i]);
 if(i!==1){await assert.rejects(call());continue;}
 const free=(await call()).rows[0];assert.equal(free.due_cents,0);await db.query("UPDATE commerce_voucher_reservations SET session_id='cs_free' WHERE id=$1",[free.id]);await db.query("UPDATE business_orders SET setup_session_id='cs_free',livemode=false WHERE id=$1",[id]);await db.query("SELECT commerce_record_payment($1,'evt_free','setup','cs_free',0,'brl',false,NULL,NULL,NULL)",[id]);assert.equal((await db.query('SELECT setup_waived FROM business_orders WHERE id=$1',[id])).rows[0].setup_waived,true);
}
const lifetimeOrder='66666666-6666-4666-8666-666666666666';
await db.query("INSERT INTO business_orders(id,request_key,user_id,name,email,plan_type,module_plan,setup_cents,monthly_cents,stage,payment_status) VALUES($1,$1,$2,'QA','fixture@example.com','essencial','agenda',25000,3990,'ready','paid')",[lifetimeOrder,owner]);
await db.exec("INSERT INTO vouchers(code,discount_type,discount_value,applies_to,commerce_enabled,discount_months) VALUES('FOREVER','percentage',10,'monthly',true,0)");
const forever=(await db.query("SELECT (commerce_reserve_voucher($1,$2,'subscription','FOREVER',true)).*",[lifetimeOrder,owner])).rows[0];assert.equal(forever.months,0);assert.equal(forever.due_cents,3591);
await db.exec("UPDATE vouchers SET expires_at='2020-01-01' WHERE code='FOREVER'");await assert.rejects(db.query("SELECT commerce_reserve_voucher($1,$2,'subscription','FOREVER',true)",[lifetimeOrder,owner]));
await db.exec("UPDATE vouchers SET expires_at=NULL,applies_to='first_payment' WHERE code='FOREVER'");assert.equal((await db.query("SELECT (commerce_reserve_voucher($1,$2,'subscription','FOREVER',true)).*",[lifetimeOrder,owner])).rows[0].months,1);
await db.close();console.log('Voucher SQL integration tests passed: preview, scope, limits, net payment, replay, fixed/zero, legacy review and privileges.');
