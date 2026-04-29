package com.example.studentcrud.service;

import com.example.studentcrud.exception.ResourceNotFoundException;
import com.example.studentcrud.model.Student;
import com.example.studentcrud.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public Student createStudent(Student student) {
        student.setId(null);
        return studentRepository.save(student);
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudentById(Integer id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
    }

    public Student updateStudent(Integer id, Student student) {
        getStudentById(id);
        student.setId(id);

        if (!studentRepository.update(student)) {
            throw new ResourceNotFoundException("Student not found with id: " + id);
        }

        return getStudentById(id);
    }

    public void deleteStudent(Integer id) {
        if (!studentRepository.deleteById(id)) {
            throw new ResourceNotFoundException("Student not found with id: " + id);
        }
    }
}
