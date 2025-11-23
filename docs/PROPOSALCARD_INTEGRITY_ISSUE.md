# ProposalCard Component Integrity Issue Report

## Issue Summary

The application is attempting to import and use a `ProposalCard` component that does not exist in the codebase. This is a critical integrity issue that will cause runtime errors when the application tries to render proposal cards.

## Evidence

1. The `index.ts` file in the components directory exports a `ProposalCard` component:
```typescript
export { default as ProposalCard } from './ProposalCard';
```

2. The `ProposalList.tsx` file imports and attempts to use the `ProposalCard` component:
```typescript
import ProposalCard from './ProposalCard';

// Used in the component
<ProposalCard key={proposal.proposalId} proposal={proposal} />
```

3. However, no `ProposalCard.tsx` or `ProposalCard.ts` file exists in the `web/src/components/` directory.

## Impact

This issue will cause a runtime error when the application loads any list of proposals, as it will be unable to resolve the module './ProposalCard' in the components directory. The error will likely be:
```
Error: Cannot find module './ProposalCard' or its corresponding type declarations
```

This breaks a core functionality of the DAO application, as users will be unable to view or interact with existing proposals.

## Solution

Create the missing component:

```bash
# Create the missing file
touch web/src/components/ProposalCard.tsx
```

Then implement the component with the following features:
- Display proposal details (ID, description, creator, dates)
- Show voting status and results (for/against/abstain votes)
- Display proposal state (active, passed, rejected, executed)
- Include vote buttons for active proposals
- Show user's vote indication if they've already voted

The component should use the `Proposal` interface from `@/types/dao` for type safety and integrate with voting functionality through the appropriate hooks.