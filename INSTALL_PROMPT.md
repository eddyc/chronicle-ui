Add @eddyc/chronicle-ui as a dependency from GitHub Packages:

1. Create `.npmrc` in the project root with:
   ```
   @eddyc:registry=https://npm.pkg.github.com
   ```

2. Run `pnpm add @eddyc/chronicle-ui`

3. The package exports:
   - `ThemeProvider`, `useThemeMode` - Theme context
   - `useChronicleTheme`, `useSemanticTokens`, `useComponentTokens` - Theme hooks
   - `Doc`, `H1`, `H2`, `H3`, `P`, `Code`, `CodeBlock`, `Callout`, `StatusBadge`, `LiveDemo` - Doc components
   - `Card` - Layout components
   - `Knob`, `ThemeToggle` - Control components
   - `colors`, `theme`, `lightTheme`, `createChronicleTheme` - Theme utilities
