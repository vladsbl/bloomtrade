// Shared bottom-tab param list. Kept in its own module so screens can import
// the type without creating an import cycle with AppNavigator.
export type RootTabParamList = {
  Home: undefined;
  Charts: { symbol?: string } | undefined;
  Trades: undefined;
  Journal: undefined;
  Settings: undefined;
};
