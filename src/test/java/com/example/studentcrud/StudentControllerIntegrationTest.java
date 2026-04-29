package com.example.studentcrud;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class StudentControllerIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        jdbcTemplate.update("DELETE FROM students");
    }

    @Test
    void shouldCreateAndFetchStudent() throws Exception {
        String requestBody = """
                {
                  "name": "Alice Johnson",
                  "email": "alice@example.com",
                  "course": "Spring Boot"
                }
                """;

        MvcResult createResult = mockMvc.perform(post("/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("/students/")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Alice Johnson"))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.course").value("Spring Boot"))
                .andReturn();

        Integer studentId = jdbcTemplate.queryForObject(
                "SELECT id FROM students WHERE email = ?",
                Integer.class,
                "alice@example.com"
        );

        mockMvc.perform(get("/students/{id}", studentId))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(studentId))
                .andExpect(jsonPath("$.name").value("Alice Johnson"));

        mockMvc.perform(get("/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldUpdateStudent() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO students (name, email, course) VALUES (?, ?, ?)",
                "Bob Smith",
                "bob@example.com",
                "Databases"
        );
        Integer studentId = jdbcTemplate.queryForObject(
                "SELECT id FROM students WHERE email = ?",
                Integer.class,
                "bob@example.com"
        );

        String requestBody = """
                {
                  "name": "Bob Smith Updated",
                  "email": "bob.updated@example.com",
                  "course": "Advanced Databases"
                }
                """;

        mockMvc.perform(put("/students/{id}", studentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(studentId))
                .andExpect(jsonPath("$.name").value("Bob Smith Updated"))
                .andExpect(jsonPath("$.email").value("bob.updated@example.com"))
                .andExpect(jsonPath("$.course").value("Advanced Databases"));
    }

    @Test
    void shouldDeleteStudent() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO students (name, email, course) VALUES (?, ?, ?)",
                "Carol Jones",
                "carol@example.com",
                "Operating Systems"
        );
        Integer studentId = jdbcTemplate.queryForObject(
                "SELECT id FROM students WHERE email = ?",
                Integer.class,
                "carol@example.com"
        );

        mockMvc.perform(delete("/students/{id}", studentId))
                .andExpect(status().isNoContent());

        Integer remainingCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM students WHERE id = ?",
                Integer.class,
                studentId
        );
        assertThat(remainingCount).isZero();
    }

    @Test
    void shouldRejectInvalidPayload() throws Exception {
        String requestBody = """
                {
                  "name": "",
                  "email": "not-an-email",
                  "course": ""
                }
                """;

        mockMvc.perform(post("/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.name").exists())
                .andExpect(jsonPath("$.details.email").exists())
                .andExpect(jsonPath("$.details.course").exists());
    }
}
