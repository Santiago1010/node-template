# Context

I'm documenting my API endpoints to ensure clarity for developers of all experience levels. I use Swagger UI with the following documentation structure:

```javascript
// Your documentation definition code
```

# Objective

Analyze the provided source code and generate comprehensive descriptions for:
1. **Main endpoint description** - Overall purpose and functionality
2. **Property descriptions** - Detailed explanations for path parameters, query parameters, and request body fields

## Requirements for Descriptions

- **Tone**: Professional, developer-friendly, moderately technical without excessive complexity
- **Audience**: Software developers of varying experience levels
- **Goal**: Complete understanding with zero ambiguity
- **Format**: Single-line markdown with escape characters for formatting (no paragraph breaks)
- **Language**: English only
- **Content depth**: Include business logic, validation rules, relationships, and practical usage notes

# Source Code Structure

Please provide the following code sections for analysis:

## 1. Complete Endpoint URL
```
{{FULL_ENDPOINT_URL}}
```

## 2. Route Definition
```javascript
// Your route/endpoint definition code
```

## 3. Validation Schema
```javascript
// Your validation middleware/schema code
```

## 4. Controller
```javascript
// Your controller implementation
```

## 5. Service Layer(s)
```javascript
// Your service/business logic code
```

## 6. Data Models
```javascript
// Your database models/entities
```

# Expected Output Requirements

## DO:
- ✅ Use **markdown formatting** with proper emphasis and structure
- ✅ Perform thorough code analysis to understand actual functionality
- ✅ Write detailed, technically accurate descriptions
- ✅ Include validation rules, constraints, and business logic implications
- ✅ Mention data relationships and dependencies
- ✅ Explain expected behaviors and edge cases
- ✅ Use single-line format with escape characters for line breaks
- ✅ Update existing descriptions if they exist and code analysis reveals improvements are needed
- ✅ Provide complete Swagger documentation definition in English

## DON'T:
- ❌ Create multi-paragraph descriptions (use `\n` for line breaks if needed)
- ❌ Include sensitive security information that could expose vulnerabilities
- ❌ Write in languages other than English
- ❌ Use plain text format (markdown required)
- ❌ Add explanatory text outside the documentation definition
- ❌ Make assumptions about functionality not evident in the code

# Output Format

Return **only** the complete Swagger documentation definition with populated descriptions, no additional explanations or commentary.
