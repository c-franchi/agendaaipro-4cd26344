-- Existing orders remain intact; fields are required by the handler for new requests.
ALTER TABLE public.business_orders ADD COLUMN phone text CHECK(length(phone)<=30),
 ADD COLUMN business_type text CHECK(length(business_type)<=100),
 ADD COLUMN business_name text CHECK(length(business_name)<=100),
 ADD COLUMN request_message text CHECK(length(request_message)<=1000);
