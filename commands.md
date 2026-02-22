`pg_restore -v -h localhost -p 5432  -U postgres -c -d backup ~/@data/dwl/insure_backup.backup`
`docker exec insure-postgres-1 pg_dump -d insure -U postgres -Fc | pg_restore -v -h <host> -p 5432  -U <user> -c -d postgres`

