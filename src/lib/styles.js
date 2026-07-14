/** Shared panel / button style tokens derived from the active theme. */

export function makeThemeStyles(theme) {
  return {
    panel: {
      background: theme.panel,
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      backdropFilter: 'blur(12px)',
    },
    btn: (active) => ({
      padding: '8px 12px',
      background: active ? theme.goldDim : 'transparent',
      border: `1px solid ${active ? theme.gold : 'transparent'}`,
      borderRadius: 6,
      color: active ? theme.gold : theme.dim,
      cursor: 'pointer',
      transition: 'all 0.25s',
      fontSize: 13,
      fontFamily: 'Georgia,serif',
      textAlign: 'left',
    }),
  };
}
