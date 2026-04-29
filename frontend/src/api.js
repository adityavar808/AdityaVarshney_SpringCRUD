const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function resolveUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(resolveUrl(path), {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    const networkError = new Error(
      "Unable to reach the backend. Start Spring Boot on http://localhost:8080 and keep the React app running on http://localhost:5173."
    );
    networkError.code = "NETWORK_ERROR";
    throw networkError;
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (typeof data === "object" && data?.message) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;
    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.details = typeof data === "object" ? data?.details : null;
    throw requestError;
  }

  return data;
}

export function getStudents() {
  return request("/students");
}

export function createStudent(student) {
  return request("/students", {
    method: "POST",
    body: JSON.stringify(student),
  });
}

export function updateStudent(id, student) {
  return request(`/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(student),
  });
}

export function deleteStudent(id) {
  return request(`/students/${id}`, {
    method: "DELETE",
  });
}
