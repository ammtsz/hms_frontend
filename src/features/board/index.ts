/**
 * Board feature public exports.
 *
 * Prefer importing route-level UI from this entry point. Internal workflow
 * pieces should stay scoped to their owning folder when possible.
 */

// Board/card components reused by tests and neighboring feature modules
export { default as AppointmentColumn } from './components/Board/AppointmentColumn';
export { default as AppointmentCard } from './components/Cards/AppointmentCard';

// Types
export * from './types';

// Main component - default export
export { default } from './AppointmentsBoard';
