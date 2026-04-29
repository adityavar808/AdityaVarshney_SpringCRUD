# Student CRUD API

This project is a Spring Boot REST API that performs CRUD operations on a `students` table using `JdbcTemplate` and PostgreSQL. It follows a layered architecture with `controller`, `service`, and `repository` classes and uses manual SQL queries instead of an ORM.

## Features

- Create a student
- Read all students
- Read a student by ID
- Update a student by ID
- Delete a student by ID
- Input validation for `name`, `email`, and `course`
- Global exception handling with JSON error responses
- Automatic table creation from `schema.sql`

## Tech Stack

- Java 21
- Spring Boot 4
- Spring Web
- Spring JDBC
- PostgreSQL
- Maven
- H2 for tests

## Student Fields

- `id` - Integer primary key
- `name` - Student name
- `email` - Student email and must be unique
- `course` - Student course

## PostgreSQL Setup

1. Create a database named `studentdb`.
2. Update `src/main/resources/application.properties` if your PostgreSQL username, password, or port is different.
3. Start the application with:

```powershell
& "C:\Program Files\PostgreSQL\18_new\bin\psql.exe" -U postgres -c "CREATE DATABASE \"studentCRUD\";"
```

If the database already exists, PostgreSQL will show an error saying it already exists. That is fine.

The `students` table does not need to be created manually. It is created automatically from `schema.sql` when the application starts.

## How To Run

Open PowerShell and run:

```powershell
cd p:\studentcrud\studentcrud
.\mvnw.cmd spring-boot:run
```

When the application starts successfully, it runs on:

```text
http://localhost:8080
```

To stop the application, press `Ctrl + C`.

## How To Run Tests

```powershell
cd p:\studentcrud\studentcrud
.\mvnw.cmd test
```

## REST API Endpoints

### 1. Create Student

- Method: `POST`
- URL: `http://localhost:8080/students`

Sample JSON body for Postman raw JSON:

```json
{
  "name": "Aditya",
  "email": "aditya_test_101@example.com",
  "course": "Java"
}
```

Expected response:

- Status: `201 Created`

### 2. Get All Students

- Method: `GET`
- URL: `http://localhost:8080/students`

Expected response:

- Status: `200 OK`

### 3. Get Student By ID

- Method: `GET`
- URL: `http://localhost:8080/students/{id}`

Example:

```text
http://localhost:8080/students/1
```

Expected response:

- Status: `200 OK` if the student exists
- Status: `404 Not Found` if the student does not exist

### 4. Update Student

- Method: `PUT`
- URL: `http://localhost:8080/students/{id}`

Sample JSON body:

```json
{
  "name": "Aditya Updated",
  "email": "aditya_test_102@example.com",
  "course": "Spring Boot"
}
```

Expected response:

- Status: `200 OK`

### 5. Delete Student

- Method: `DELETE`
- URL: `http://localhost:8080/students/{id}`

Expected response:

- Status: `204 No Content`

## Postman Testing Flow

Use this order while testing:

1. `POST /students`
2. `GET /students`
3. `GET /students/{id}`
4. `PUT /students/{id}`
5. `DELETE /students/{id}`
6. `GET /students/{id}` again to confirm deletion

Use a new email every time you create a student because the `email` field must be unique.

## PowerShell Testing Commands

### Create Student

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8080/students" `
  -ContentType "application/json" `
  -Body '{"name":"Aditya","email":"aditya_test_101@example.com","course":"Java"}'
```

### Get All Students

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/students"
```

### Get Student By ID

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/students/1"
```

### Update Student

```powershell
Invoke-RestMethod -Method Put `
  -Uri "http://localhost:8080/students/1" `
  -ContentType "application/json" `
  -Body '{"name":"Aditya Updated","email":"aditya_test_102@example.com","course":"Spring Boot"}'
```

### Delete Student

```powershell
Invoke-RestMethod -Method Delete -Uri "http://localhost:8080/students/1"
```

## Validation Rules

- `name` cannot be blank
- `email` cannot be blank
- `email` must be in valid email format
- `course` cannot be blank

## Common Error Responses

### Validation Error

If invalid input is sent:

```json
{
  "timestamp": "2026-04-29T09:08:26.040618200Z",
  "status": 400,
  "message": "Validation failed",
  "details": {
    "name": "Name is required",
    "email": "Email must be valid",
    "course": "Course is required"
  }
}
```

### Duplicate Email

If the same email is used again:

```json
{
  "timestamp": "2026-04-29T09:18:01.778469900Z",
  "status": 409,
  "message": "A student with this email already exists",
  "details": null
}
```

### Student Not Found

If a non-existing ID is requested:

```json
{
  "timestamp": "2026-04-29T09:20:00.000000000Z",
  "status": 404,
  "message": "Student not found with id: 999",
  "details": null
}
```

## Troubleshooting

### Problem: `Database operation failed`

Check these points:

- PostgreSQL service is running
- Database name in `application.properties` exists
- Username and password are correct
- The application was restarted after configuration or code changes

### Problem: `409 Conflict`

This means the email already exists in the database. Use another email or delete the existing record first.

### Problem: Application does not start

Check:

- Java 21 is installed
- PostgreSQL is running on the expected port
- The database credentials are correct

## Notes

- The application uses manual SQL with `JdbcTemplate`
- No Hibernate or JPA is used
- The table is initialized from `schema.sql`
- Tests run with H2 so they do not require your local PostgreSQL database
