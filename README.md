# Student CRUD API

This project is a Spring Boot REST API that uses `JdbcTemplate` and PostgreSQL to perform CRUD operations on a single `students` table.

## Features

- Create a student with `POST /students`
- Fetch all students with `GET /students`
- Fetch one student with `GET /students/{id}`
- Update a student with `PUT /students/{id}`
- Delete a student with `DELETE /students/{id}`
- Manual SQL with layered architecture: controller, service, repository

## Student Fields

- `id` - Integer primary key
- `name` - Student name
- `email` - Student email
- `course` - Student course

## PostgreSQL Setup

1. Create a database named `studentCRUD`.
2. Update `src/main/resources/application.properties` if your PostgreSQL username, password, or port is different.
3. Start the application with:

```bash
./mvnw spring-boot:run
```

The `schema.sql` file creates the `students` table automatically on startup.

## Example Request

```http
POST /students
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "course": "Spring Boot"
}
```
