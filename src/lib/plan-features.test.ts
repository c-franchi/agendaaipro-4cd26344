// @ts-ignore bun test runner
import {describe,it,expect} from 'bun:test';
import {allowedFeatures} from './plan-features';
describe('recursos por plano',()=>{
 it('Agenda não inclui estoque',()=>{expect(allowedFeatures('agenda')).not.toContain('estoque')});
 it('Gestão inclui financeiro mas não multiprofissional',()=>{expect(allowedFeatures('gestao')).toContain('financeiro');expect(allowedFeatures('gestao')).not.toContain('multiprofissional')});
 it('Premium inclui multiprofissional',()=>{expect(allowedFeatures('premium')).toContain('multiprofissional')});
});
