# Contributing to PIIxelate

Thank you for your interest in contributing to PIIxelate! This document provides guidelines and best practices for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/piixelate.git
cd piixelate

# Install dependencies
npm install

# Set up pre-commit hooks
npm run prepare

# Start development server
npm run dev
```

## 📋 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Follow the coding standards below
- Write tests for new functionality
- Update documentation as needed

### 3. Run Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format:check

# Tests
npm test
```

### 4. Commit Your Changes
```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add new PII detection algorithm"
```

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

## 🏗️ Architecture Guidelines

### Code Organization
- Follow the modular architecture established in the refactored system
- Keep files focused on single responsibilities
- Use clear, descriptive file and folder names

### Type Safety
- Use TypeScript strict mode
- Define proper interfaces for all data structures
- Avoid `any` types when possible
- Use proper type guards and validation

### Error Handling
- Use the centralized error handling system
- Provide meaningful error messages
- Implement proper fallback strategies
- Log errors appropriately

### Performance
- Optimize algorithms and data structures
- Implement proper memory management
- Use efficient patterns and avoid anti-patterns
- Profile code when necessary

## 📝 Coding Standards

### TypeScript
```typescript
// ✅ Good
interface UserConfig {
  name: string;
  email: string;
  preferences?: UserPreferences;
}

const createUser = (config: UserConfig): User => {
  // Implementation
};

// ❌ Bad
const createUser = (config: any) => {
  // Implementation
};
```

### Error Handling
```typescript
// ✅ Good
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  errorHandler.handleProcessingError('risky_operation', error as Error);
  return fallbackValue;
}

// ❌ Bad
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Error:', error);
  return null;
}
```

### Configuration
```typescript
// ✅ Good
const config = detectionConfig.getConfig();
const isValid = config.enableFeature && config.featureThreshold > 0;

// ❌ Bad
const isValid = process.env.FEATURE_ENABLED === 'true' && 
                parseInt(process.env.THRESHOLD) > 0;
```

### Documentation
```typescript
/**
 * Detects PII in the given image using multiple detection methods
 * 
 * @param imageSrc - The source of the image to process
 * @param options - Optional configuration for detection
 * @returns Promise resolving to detection results
 * 
 * @example
 * ```typescript
 * const results = await detectPII('data:image/jpeg;base64,...', {
 *   enableLLM: true,
 *   confidenceThreshold: 0.8
 * });
 * ```
 */
export async function detectPII(
  imageSrc: string, 
  options?: DetectionOptions
): Promise<DetectionResult> {
  // Implementation
}
```

## 🧪 Testing Guidelines

### Unit Tests
- Test individual functions and components
- Mock external dependencies
- Test edge cases and error conditions
- Maintain high test coverage

```typescript
// Example test
describe('PatternDetector', () => {
  it('should detect credit card numbers', async () => {
    const detector = new PatternDetector();
    const result = await detector.detectPII({
      text: 'Card: 1234-5678-9012-3456',
      lines: []
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('credit_card');
  });
});
```

### Integration Tests
- Test component interactions
- Test API integrations
- Test end-to-end workflows
- Use realistic test data

### Performance Tests
- Test processing time
- Test memory usage
- Test with large datasets
- Monitor for regressions

## 🔧 Code Quality Tools

### ESLint
- Enforces code style and best practices
- Catches common errors
- Ensures consistent formatting

### Prettier
- Automatic code formatting
- Consistent style across the project
- Reduces formatting discussions

### TypeScript
- Static type checking
- Catches type-related errors
- Improves code documentation

### Husky & lint-staged
- Pre-commit hooks for quality checks
- Ensures code quality before commits
- Automates formatting and linting

## 📚 Documentation Standards

### Code Comments
- Use JSDoc for public APIs
- Explain complex algorithms
- Document assumptions and limitations
- Keep comments up to date

### README Updates
- Update README for new features
- Include usage examples
- Document configuration changes
- Update installation instructions

### API Documentation
- Document all public interfaces
- Include parameter descriptions
- Provide usage examples
- Document error conditions

## 🚨 Security Guidelines

### Input Validation
- Validate all user inputs
- Sanitize data before processing
- Use proper type checking
- Implement rate limiting

### API Security
- Secure API key handling
- Implement proper authentication
- Use HTTPS for all communications
- Validate API responses

### Data Privacy
- Follow privacy best practices
- Implement data minimization
- Secure data transmission
- Proper data disposal

## 🎯 Pull Request Guidelines

### Before Submitting
- [ ] Code follows style guidelines
- [ ] Tests pass and coverage is adequate
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Performance impact is considered

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🏷️ Commit Message Convention

Use conventional commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

### Examples
```
feat(detection): add new PII detection algorithm
fix(ocr): resolve memory leak in OCR processing
docs(readme): update installation instructions
refactor(config): improve configuration validation
```

## 🤝 Community Guidelines

### Communication
- Be respectful and inclusive
- Provide constructive feedback
- Ask questions when needed
- Help other contributors

### Code Review
- Review code thoroughly
- Provide helpful feedback
- Suggest improvements
- Approve when satisfied

### Issue Reporting
- Use clear, descriptive titles
- Include reproduction steps
- Provide relevant information
- Be patient and responsive

## 📞 Getting Help

- **Documentation**: Check the README and code comments
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask for help in pull requests

## 🎉 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributor hall of fame
- GitHub contributors page

Thank you for contributing to PIIxelate! 🛡️
