import { render } from '@testing-library/react';
import { CalendarProvider } from '../context/CalendarContext';

const customRender = (ui, options) =>
    render(ui, { wrapper: CalendarProvider, ...options });

export * from '@testing-library/react';
export { customRender as render };
