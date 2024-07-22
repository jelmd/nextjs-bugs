Initial setup
=============
The thing is buggy too - need to specify project name twice if --no- gets used:
```
setenv APPNAME 01_auth
#npx create-next-app@rc --typescript --eslint --app --src-dir --turbo \
#	--no-tailwind --no-import-alias --empty \
#	${APPNAME} ${APPNAME}
cp -pr template ${APPNAME}
mv ${APPNAME}/.env.example ${APPNAME}/.env


cd ${APPNAME}
#npm install --legacy-peer-deps \
#	@next-auth/prisma-adapter@latest @prisma/client@latest
#npm install -D --legacy-peer-deps \
#	next-auth@beta prisma@latest ts-node@latest
npm install
```

Update
======
```
cd ${APPNAME}
npm install --legacy-peer-deps next@rc react@rc react-dom@rc \
	@next-auth/prisma-adapter@latest @prisma/client@latest
npm install -D @types/react@latest @types/react-dom@latest \
	eslint@8.57.0 eslint-config-next@rc next-auth@beta \
	prisma@latest ts-node@latest typescript@latest
```

DB setup
========
```
mysql -h localhost -u root -p

USE mysql;
CREATE USER 'tester' IDENTIFIED BY 'pwtest';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, REFERENCES ON testdb.* TO 'tester'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, REFERENCES ON testdb_tmp.* TO 'tester'@'%';

DROP DATABASE testdb;
DROP DATABASE testdb_tmp;
CREATE DATABASE testdb;
CREATE DATABASE testdb_tmp;
QUIT;

# in ${APPNAME}/
npm exec prisma generate
npm exec prisma migrate dev

mysql -h localhost -u tester -p testdb        # pwtest
INSERT INTO `user` VALUES (1,'john','John','','Doe','johnd','john.doe@example.com','2023-07-01 12:34:56.789','c9cc61d920d4349df9f71ea323fb1c14988fe8e147d9917d9c3808035d4c77b1d8cf1a193030a4c5772cd11606fdd5b2dea3051573e077db2e12bd66115530','2023-07-01 12:30:00.000','2023-07-01 12:30:00.000','2023-07-01 12:30:00.000',NULL,'GUEST','de',NULL),(2,'jane','Jane','','Smith','janes','jane.smith@example.com','2023-07-02 10:11:12.345','2e11705a4bef4fd9f9e07eb9c5d5bf05c4a8458b7c8750bab475f24c311774a5c8501bf26aad9548bff6d6889c77fbea068e89c98e52b8b2a2e2e0640cd1ec','2023-07-02 10:10:00.000','2023-07-02 10:10:00.000','2023-07-02 10:10:00.000',NULL,'GUEST','de',NULL);
```

App Logins: john/doe , jane/smith
