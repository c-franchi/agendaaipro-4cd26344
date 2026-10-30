GRANT USAGE ON SCHEMA vault TO sandbox_exec;
GRANT EXECUTE ON FUNCTION vault.create_secret(text,text,text,uuid) TO sandbox_exec;