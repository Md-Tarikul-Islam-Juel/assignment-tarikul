# Bank Management App

Angular frontend + NestJS backend (MySQL, Redis).  
You need **Node.js**, **npm**, and **Docker** installed.

---

## How to run

### Backend (do this first)

```bash
cd backend-nestjs
npm install
cp .env.example .env
docker compose -f docker-compose-dev.yml up -d
npm run prisma:dev:deploy
npm run db:seed
npm run start:dev
```

Backend runs at **http://localhost:3000**.

### Frontend (in a new terminal)

```bash
cd frontend-angular
npm install
npm start
```

Frontend runs at **http://localhost:4200**.

---

## Login

Use any of these (password for all: **12345@aA**):

- **Admin:** admin@gmail.com
- **Employee:** employee@gmail.com
- **Customer:** customer@gmail.com

---

## Useful commands

| Where            | Command            | What it does            |
| ---------------- | ------------------ | ----------------------- |
| backend-nestjs   | `npm run db:reset` | Reset DB and run seed   |
| backend-nestjs   | `npm run test`     | Run backend tests       |
| frontend-angular | `npm run build`    | Build frontend for prod |

**Postman:** Import `backend-nestjs/postman/assignment-tarikul.postman_collection.json`. Base URL: `http://localhost:3000`.

---

## Screenshots

**Auth (login → forgot password → change password → create account)**

1. **Login page**

![Login page](images/login%20page.png)

2. **Forgot password page**

![Forgot password page](images/forgot%20password%20page.png)

3. **Change password**

![Change password](images/change%20password.png)

4. **Create account page**

![Create account page](images/create%20account%20page.png)

5. **Dashboard**

![Dashboard](images/Deshboard.png)

6. **Accounts**

![Accounts](images/Accounts.png)

7. **Amount transfer**

![Amount transfer](images/amount%20transfer.png)

8. **Amount withdraw**

![Amount withdraw](images/amount%20withdraw.png)

9. **Account history**

![Account history](images/Account%20history.png)

10. **Apply for loan**

![Apply for loan](images/apply%20for%20loan.png)

11. **Loan**

![Loan](images/Loan.png)

12. **Plans**

![Plans](images/Plans.png)

13. **Open fixed deposit**

![Open fixed deposit](images/open%20fixed%20deposite.png)

14. **Open recurring deposit**

![Open recurring deposit](images/open%20recurring%20deposit.png)

15. **Reports**

![Reports](images/Reports.png)

16. **Generated report PDF**

![Generated report PDF](images/generated%20report%20pdf.png)
