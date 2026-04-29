package com.example.studentcrud.repository;

import com.example.studentcrud.model.Student;
import org.springframework.dao.support.DataAccessUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class JdbcStudentRepository implements StudentRepository {

    private static final RowMapper<Student> STUDENT_ROW_MAPPER = (resultSet, rowNum) ->
            new Student(
                    resultSet.getInt("id"),
                    resultSet.getString("name"),
                    resultSet.getString("email"),
                    resultSet.getString("course")
            );

    private final JdbcTemplate jdbcTemplate;

    public JdbcStudentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Student save(Student student) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO students (name, email, course) VALUES (?, ?, ?)",
                    new String[]{"id"}
            );
            statement.setString(1, student.getName());
            statement.setString(2, student.getEmail());
            statement.setString(3, student.getCourse());
            return statement;
        }, keyHolder);

        Map<String, Object> generatedKeys = keyHolder.getKeys();
        if (generatedKeys != null) {
            Object id = generatedKeys.getOrDefault("id", generatedKeys.get("ID"));
            if (id instanceof Number generatedId) {
                student.setId(generatedId.intValue());
            }
        }

        return student;
    }

    @Override
    public List<Student> findAll() {
        return jdbcTemplate.query(
                "SELECT id, name, email, course FROM students ORDER BY id",
                STUDENT_ROW_MAPPER
        );
    }

    @Override
    public Optional<Student> findById(Integer id) {
        List<Student> students = jdbcTemplate.query(
                "SELECT id, name, email, course FROM students WHERE id = ?",
                STUDENT_ROW_MAPPER,
                id
        );

        return Optional.ofNullable(DataAccessUtils.singleResult(students));
    }

    @Override
    public boolean update(Student student) {
        int rowsUpdated = jdbcTemplate.update(
                "UPDATE students SET name = ?, email = ?, course = ? WHERE id = ?",
                student.getName(),
                student.getEmail(),
                student.getCourse(),
                student.getId()
        );

        return rowsUpdated > 0;
    }

    @Override
    public boolean deleteById(Integer id) {
        return jdbcTemplate.update("DELETE FROM students WHERE id = ?", id) > 0;
    }
}
