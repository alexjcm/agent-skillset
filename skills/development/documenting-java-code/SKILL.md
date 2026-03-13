---
name: documenting-java-code
description: Generate standard JavaDocs for Java code. Use when the user explicitly requests to "document code", "add javadoc" in Java files.
---

# Documenting Java Code

This skill assists in generating concise, consistent documentation for Java code following conventions.

## Rules

### JavaDoc Placement & Scope
- Place **BEFORE** Java annotations
- Document: Classes, Public methods, Constructors
- **DO NOT** document: Fields
- **DO NOT** include `@author` tag

### Language & Format
- Default: **English**, unless the user explicitly requests another language.
- **NO** HTML tags (`<p>`, `<br>`)
- **NO** `@throws` tag

### Standard Templates

**Class:**
```java
/**
 * [Brief description of class responsibility].
 * 
 * @author alexjcm
 */
```

**Constructor:**
```java
/**
 * Constructor for dependency injection.
 */
```

**Method:**
```java
/**
 * [Action verb + brief description].
 * 
 * @param paramName short description
 * @return short description
 */
```

**Override:**
```java
/** 
 * {@inheritDoc} 
 */
```
