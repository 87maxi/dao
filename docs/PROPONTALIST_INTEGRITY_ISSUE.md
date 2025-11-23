# ProposalList Component Integrity Issue Report

## Issue Summary

The application is attempting to import and use a `ProposalList` component that does not exist in the codebase. This is a critical integrity issue that will cause runtime errors when the application tries to render the component.

## Evidence

1. The `index.ts` file in the components directory exports a `ProposalList` component:
```typescript
export { default as ProposalList } from './ProposalList';
```

2. The `page.tsx` file imports and attempts to use the `ProposalList` component:
```typescript
import ProposalList from '@/components/ProposalList';

// Used in the component
<ProposalList />
```

3. However, no `ProposalList.tsx` or `ProposalList.ts` file exists in the `web/src/components/` directory.

## Impact

This issue will cause a runtime error when the application loads, as it will be unable to resolve the module './ProposalList' in the components directory. The error will likely be:
```
Error: Cannot find module './ProposalList' or its corresponding type declarations
```

## Solution

Two possible solutions:

1. **Create the missing component:**
```bash
# Create the missing file
touch web/src/components/ProposalList.tsx
```

Then implement the component to display a list of proposals, likely using the `ProposalCard` component for each proposal.

2. **Remove the incorrect import and usage** if the component is not needed.

Given that both the import in `page.tsx` and the export in `index.ts` reference `ProposalList`, it appears this component was intended to be created but was not implemented.