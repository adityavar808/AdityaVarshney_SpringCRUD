package com.example.studentcrud.repository;

import com.example.studentcrud.model.Student;

import java.util.List;
import java.util.Optional;

public interface StudentRepository {

    Student save(Student student);

    List<Student> findAll();

    Optional<Student> findById(Integer id);

    boolean update(Student student);

    boolean deleteById(Integer id);
}
