export function confirmDiscardUnsavedClimbingEdits(
  hasUnsavedEdits: boolean,
): boolean {
  if (!hasUnsavedEdits) {
    return true;
  }
  // eslint-disable-next-line no-alert
  return window.confirm(
    'Are you sure you want to cancel? You might loose your changes.',
  );
}
