---
name: writing-junit-tests
description: Generate JUnit 4 tests for Java 8. Defaults to unit tests unless user explicitly requests integration tests. Use when user requests "unit tests", "integration tests", "write tests".
---

# Writing JUnit Tests

This skill assists in generating unit and integration tests for Java applications using JUnit 4 following AAA/GWT patterns.

## Quick Decision Tree

Is it a Spring component (Controller/Service/Repository)?
- YES → Integration Test (SpringRunner + GWT)
- NO → Unit Test (MockitoJUnitRunner + AAA)

## Unit Tests (Isolated logic, no Spring Context)

**Core Annotations (JUnit 4 + Mockito):**
- `@RunWith(MockitoJUnitRunner.class)`: Required to initialize mocks (`org.mockito.junit.MockitoJUnitRunner`).
- `@Mock`: Define mocked dependencies.
- `@InjectMocks`: Inject mocks into the class under test.
- `@Test`: Marks a method as a test case (`org.junit.Test`).
- `@Before` / `@After`: Setup and teardown methods (replaces `@BeforeEach` / `@AfterEach`).
- No use @DisplayName annotation.
- Avoid using any JUnit assertions like assertEquals or assertTrue. Always use AssertJ for all checks.
- Always use static imports for AssertJ assertions: import static org.assertj.core.api.Assertions.assertThat;

**Structure (AAA):**
- Arrange: Prepare data and mocks.
- Act: Call the method under test.
- Assert: Verify results and mock interactions (`org.junit.Assert`).

### Test Method Example (AAA Pattern)
```java
@Test
public void shouldReturnExpectedResultWhenValidInput() {
    // Arrange
    InputType input = new InputType("value");
    when(dependency.method(any())).thenReturn(expectedValue);
    
    // Act
    ResultType result = classUnderTest.methodUnderTest(input);
    
    // Assert
    assertThat(result).isNotNull();
    assertThat(result.getValue()).isEqualTo(expectedValue);
    verify(dependency).method(any());
}
```

### Naming Convention Example (BDD Style)
- shouldReturnUserWhenIdExists
- shouldThrowExceptionWhenInputIsNull
- shouldUpdateStatusWhenValidRequest


## Integration Tests (Spring Context)

**Core Annotations:**
- `@RunWith(SpringRunner.class)`: **Mandatory** for Spring context in JUnit 4.
- `@SpringBootTest`: Full context.
- `@WebMvcTest(Controller.class)`: Web layer slice.
- `@DataJpaTest`: Persistence layer slice.
- `@MockBean`: Mock Spring beans.
- `@Autowired`: Inject real beans.
- `@ActiveProfiles("test")`: Activate test profile.
- `@Transactional`: Auto-rollback.

**Structure (GWT):**
- Given: Initial state setup.
- When: Action triggered.
- Then: Expected outcome verification.

### Test Method Example (GWT Pattern)
```java
@Test
public void givenValidUserWhenCreateThenReturnCreated() throws Exception {
    // Given
    UserDTO userDTO = new UserDTO("John", "Doe");
    when(service.create(any())).thenReturn(savedUser);
    
    // When
    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(userDTO)))
    
    // Then
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("John"));
}
```

### Naming Convention Example (GWT Style)
- givenValidInputWhenProcessThenReturnSuccess
- givenMissingDataWhenValidateThenReturnBadRequest
- givenExistingUserWhenUpdateThenReturnOk

## Assertions (Always use AssertJ 3.9.x)

**Basic:**
```java
assertThat(actual).isEqualTo(expected);
assertThat(value).isNotNull();
assertThat(flag).isTrue();
```

**Collections:**
```java
assertThat(list).hasSize(3);
assertThat(list).contains(item);
assertThat(list).isEmpty();
```

**Exceptions:**
```java
assertThatThrownBy(() -> service.method())
    .isInstanceOf(CustomException.class)
    .hasMessage("Expected message");
```

**Objects:**
```java
assertThat(user)
    .isNotNull()
    .extracting("name", "email")
    .containsExactly("John", "john@example.com");
```

## Critical Rules

- Default to unit tests when test type is not specified
- ALWAYS use `@RunWith` (MockitoJUnitRunner or SpringRunner)
- Use AssertJ (`assertThat`) over JUnit assertions
- Follow AAA for unit tests, GWT for integration tests
- Use BDD naming (`should...When` or `given...When...Then`)
- Place unit tests in same package under `src/test/java`
- Place integration tests in same package under `src/integration-test/java`
- NEVER use JUnit 5 annotations (`@BeforeEach`, `@ExtendWith`)
- NEVER mix `assertEquals` with `assertThat`
- Don't test getters/setters
- ALWAYS use static imports for Mockito: `when`, `doNothing`, `doReturn`, `doThrow`, `verify`, `eq`, `any`, etc. NEVER use qualified calls like `Mockito.when(...)` or `Mockito.eq(...)`
- Avoid using FQCN, prefer import