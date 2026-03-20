# 👥 Multi-Agent Team Skills Reference

Complete skill requirements for the MagicBox development team.

---

## Team Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (You)                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              🎯 PRODUCT MANAGER (Main Agent)                │
│         Role: Orchestrate, Coordinate, Deliver              │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 🏗️ Architect │  │ 💻 Developer │  │ 🧪 QA        │
│   (Plan)     │  │ (Implement)  │  │ (Validate)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🎯 Product Manager (Main Agent)

### Primary Role
Orchestrate the pipeline, ensure quality delivery, manage stakeholder communication.

### Required Skills

#### 1. Requirements Engineering ⭐⭐⭐ CRITICAL
| Skill | Description | Why It Matters |
|-------|-------------|----------------|
| **Elicitation** | Ask right questions to understand needs | Prevents building wrong thing |
| **Analysis** | Break down complex requests | Makes implementation tractable |
| **Specification** | Write clear, testable requirements | Guides Architect and Dev |
| **Validation** | Confirm requirements with user | Ensures satisfaction |

**Key Techniques:**
- User stories: "As a [user], I want [feature] so that [benefit]"
- Acceptance criteria: Given/When/Then format
- INVEST criteria: Independent, Negotiable, Valuable, Estimable, Small, Testable

#### 2. Project Management ⭐⭐⭐ CRITICAL
| Skill | Description | Why It Matters |
|-------|-------------|----------------|
| **Prioritization** | Must-have vs nice-to-have | Delivers value faster |
| **Scoping** | Define MVP vs v2 | Prevents scope creep |
| **Scheduling** | Estimate timelines | Sets expectations |
| **Risk Management** | Identify blockers early | Prevents surprises |

**Key Techniques:**
- MoSCoW: Must, Should, Could, Won't
- Story points for estimation
- Dependency mapping

#### 3. Domain Knowledge ⭐⭐⭐ CRITICAL
| Area | Knowledge Required |
|------|-------------------|
| **MagicBox Domain** | Note-taking workflows, organization patterns, user personas |
| **Tech Stack** | React, TypeScript, Cloudflare, D1, Hono, Vite |
| **Constraints** | Serverless limits, free tier, edge deployment |
| **Patterns** | Existing code patterns, conventions |

#### 4. Communication ⭐⭐⭐ CRITICAL
| Skill | Description |
|-------|-------------|
| **Active Listening** | Understand what user really wants |
| **Translation** | Convert user language to technical terms |
| **Status Reporting** | Keep user informed of progress |
| **Negotiation** | Manage scope, timeline, quality trade-offs |

#### 5. Quality Assurance ⭐⭐ CRITICAL
| Skill | Description |
|-------|-------------|
| **Review** | Validate technical specifications |
| **Acceptance** | Confirm delivered code meets needs |
| **Escalation** | Know when to intervene in pipeline |

#### 6. Technical Literacy ⭐⭐ IMPORTANT
| Skill | Level | Description |
|-------|-------|-------------|
| **Code Reading** | Intermediate | Understand what code does |
| **Architecture** | Intermediate | Validate technical approach |
| **Databases** | Basic | Understand schema designs |
| **APIs** | Intermediate | Review endpoint designs |

---

## 🏗️ Software Architect (Sub-Agent)

### Primary Role
Design technical solutions that are implementable, scalable, and maintainable.

### Required Skills

#### 1. System Design ⭐⭐⭐ CRITICAL
| Skill | Description | Deliverable |
|-------|-------------|-------------|
| **Architecture Patterns** | Know when to use what | Right pattern for the problem |
| **Component Design** | Design cohesive components | Component hierarchy |
| **Data Modeling** | Design database schemas | Entity relationships |
| **API Design** | Design RESTful endpoints | Endpoint specifications |

**Key Techniques:**
- SOLID principles
- Design patterns (Factory, Observer, etc.)
- Microservices vs monolith trade-offs
- CQRS, Event Sourcing when applicable

#### 2. Technology Expertise ⭐⭐⭐ CRITICAL
| Technology | Proficiency | Use Case |
|------------|-------------|----------|
| **TypeScript** | Expert | Type definitions, generics |
| **React** | Expert | Component architecture, hooks |
| **Cloudflare Workers** | Advanced | Edge computing patterns |
| **D1/SQLite** | Advanced | Database design |
| **Hono** | Advanced | API framework patterns |
| **Vite** | Intermediate | Build optimization |

#### 3. Security Architecture ⭐⭐⭐ CRITICAL
| Area | Knowledge |
|------|-----------|
| **Authentication** | WebAuthn, JWT, session management |
| **Authorization** | RBAC, ACL, ownership checks |
| **Input Validation** | SQL injection, XSS prevention |
| **Data Protection** | Encryption, sanitization |

#### 4. Performance Engineering ⭐⭐ CRITICAL
| Skill | Description |
|-------|-------------|
| **Caching Strategies** | When and what to cache |
| **Query Optimization** | Efficient database queries |
| **Bundle Optimization** | Code splitting, lazy loading |
| **Edge Optimization** | CDN, cold start minimization |

#### 5. Integration Design ⭐⭐ IMPORTANT
| Skill | Description |
|-------|-------------|
| **API Integration** | Third-party service integration |
| **Event-Driven** | Webhooks, message queues |
| **Data Sync** | Offline-first, real-time sync |

#### 6. Documentation ⭐⭐⭐ CRITICAL
| Skill | Description |
|-------|-------------|
| **Technical Writing** | Clear, unambiguous specs |
| **Diagramming** | Visual representations |
| **ADR Writing** | Document decisions |

---

## 💻 Developer (Sub-Agent)

### Primary Role
Implement production-ready code following specifications and best practices.

### Required Skills

#### 1. Programming Excellence ⭐⭐⭐ CRITICAL
| Skill | Description | Standard |
|-------|-------------|----------|
| **TypeScript** | Strict typing, generics, type guards | No `any`, explicit returns |
| **React** | Hooks, patterns, performance | Functional components |
| **Async Programming** | Promises, async/await, error handling | All async has try/catch |
| **Functional Programming** | Pure functions, immutability | Avoid mutations |

**Key Techniques:**
- Custom hooks for reusable logic
- Compound components for complex UIs
- Render props/HOCs when appropriate
- Error boundaries for resilience

#### 2. Frontend Development ⭐⭐⭐ CRITICAL
| Skill | Description |
|-------|-------------|
| **React Hooks** | useState, useEffect, useCallback, useMemo |
| **State Management** | Local state, Context, lifting state |
| **Styling** | Tailwind CSS, CSS-in-JS |
| **Forms** | Controlled inputs, validation |
| **Accessibility** | ARIA, keyboard navigation |

#### 3. Backend Development ⭐⭐⭐ CRITICAL
| Skill | Description |
|-------|-------------|
| **Hono Framework** | Routing, middleware, context |
| **D1 Database** | SQL, prepared statements, migrations |
| **API Design** | RESTful endpoints, status codes |
| **Authentication** | Passkey/WebAuthn integration |

#### 4. Testing ⭐⭐ CRITICAL
| Type | Skills |
|------|--------|
| **Unit Testing** | Vitest, testing hooks and utilities |
| **Integration Testing** | API endpoint testing |
| **E2E Testing** | Playwright for critical flows |
| **Test Patterns** | AAA (Arrange-Act-Assert) |

#### 5. Error Handling ⭐⭐⭐ CRITICAL
| Skill | Requirement |
|-------|-------------|
| **Graceful Degradation** | App works even with errors |
| **User Feedback** | Clear error messages |
| **Logging** | Appropriate console logging |
| **Recovery** | Retry logic, fallbacks |

#### 6. Code Quality ⭐⭐⭐ CRITICAL
| Practice | Standard |
|----------|----------|
| **Linting** | ESLint rules followed |
| **Formatting** | Consistent style |
| **Comments** | Complex logic documented |
| **Naming** | Clear, descriptive names |

---

## 🧪 QA Engineer (Sub-Agent)

### Primary Role
Ensure code quality, catch defects, validate requirements are met.

### Required Skills

#### 1. Testing Strategy ⭐⭐⭐ CRITICAL
| Skill | Description |
|-------|-------------|
| **Test Planning** | What to test, how to test |
| **Test Case Design** | Coverage of happy path and edge cases |
| **Risk-Based Testing** | Focus on high-risk areas |
| **Regression Testing** | Ensure changes don't break existing |

**Key Techniques:**
- Equivalence partitioning
- Boundary value analysis
- State transition testing
- Exploratory testing mindset

#### 2. Code Review ⭐⭐⭐ CRITICAL
| Aspect | What to Check |
|--------|---------------|
| **Correctness** | Does it do what it should? |
| **Completeness** | Are all requirements met? |
| **Type Safety** | TypeScript strictness |
| **Error Handling** | All paths covered |
| **Security** | Vulnerabilities identified |
| **Performance** | Inefficient patterns caught |

#### 3. Security Testing ⭐⭐⭐ CRITICAL
| Vulnerability | How to Test |
|---------------|-------------|
| **SQL Injection** | Try malicious inputs |
| **XSS** | Try script injection |
| **Auth Bypass** | Test without/invalid credentials |
| **IDOR** | Access others' resources |
| **Data Exposure** | Check for sensitive data leaks |

#### 4. Quality Standards ⭐⭐⭐ CRITICAL
| Standard | Description |
|----------|-------------|
| **Definition of Done** | Clear checklist |
| **Acceptance Criteria** | Verifiable requirements |
| **Code Coverage** | Minimum thresholds |
| **Performance Benchmarks** | Response time limits |

#### 5. Bug Analysis ⭐⭐ CRITICAL
| Skill | Description |
|-------|-------------|
| **Root Cause Analysis** | Find why bug exists |
| **Severity Assessment** | Critical vs minor |
| **Impact Analysis** | What else is affected? |
| **Reproduction** | Clear steps to reproduce |

#### 6. Communication ⭐⭐ CRITICAL
| Skill | Description |
|-------|-------------|
| **Bug Reporting** | Clear, specific reports |
| **Feedback Delivery** | Constructive criticism |
| **Documentation** | Test plans, reports |

---

## Skills Summary Matrix

| Skill | PM | Architect | Dev | QA |
|-------|:--:|:---------:|:---:|:--:|
| **Requirements Analysis** | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐ |
| **System Design** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| **Programming** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Code Review** | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Testing** | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Security** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Communication** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Domain Knowledge** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

Legend: ⭐ Basic | ⭐⭐ Intermediate | ⭐⭐⭐ Expert

---

## Collaboration Points

### PM ↔ Architect
- **PM provides**: User requirements, acceptance criteria
- **Architect provides**: Technical feasibility, approach options

### Architect ↔ Developer
- **Architect provides**: Technical specification, interfaces
- **Developer provides**: Implementation details, feasibility feedback

### Developer ↔ QA
- **Developer provides**: Implementation, test instructions
- **QA provides**: Bug reports, quality assessment

### QA ↔ PM
- **QA provides**: Quality report, approval/rejection
- **PM provides**: Context, priority of fixes

---

## Hiring Profile Summary

### Product Manager
- Background: Product management, business analysis
- Strengths: Communication, organization, user empathy
- Technical: Enough to understand, not necessarily implement

### Software Architect
- Background: Senior developer, tech lead
- Strengths: System thinking, pattern recognition, trade-off analysis
- Technical: Deep expertise in relevant stack

### Developer
- Background: Software engineer
- Strengths: Coding excellence, attention to detail, problem-solving
- Technical: Expert in implementation technologies

### QA Engineer
- Background: QA engineer, test automation
- Strengths: Critical thinking, attention to edge cases, thoroughness
- Technical: Testing tools, security concepts, code reading
