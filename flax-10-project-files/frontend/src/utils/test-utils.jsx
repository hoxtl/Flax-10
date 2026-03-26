import { render as rtlRender, renderHook as rtlRenderHook } from '@testing-library/react';
import { AuthContext } from '../context/AuthenticationContext';

function readStoredUser() {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
        return JSON.parse(storedUser);
    } catch {
        return null;
    }
}

function AppTestProviders({ children }) {
    const storedUser = readStoredUser();
    const authValue = {
        user: storedUser,
        profile: storedUser,
        loading: false,
        authenticated: !!localStorage.getItem('token'),
        refreshProfile: async () => storedUser,
        setAuthenticated: () => {},
    };
    return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

function composeWrapper(ExtraWrapper) {
    return function Wrapper({ children }) {
        const content = <AppTestProviders>{children}</AppTestProviders>;
        return ExtraWrapper ? <ExtraWrapper>{content}</ExtraWrapper> : content;
    };
}

const customRender = (ui, options = {}) => {
    const { wrapper, ...rest } = options;
    return rtlRender(ui, { wrapper: composeWrapper(wrapper), ...rest });
};

const customRenderHook = (renderCallback, options = {}) => {
    const { wrapper, ...rest } = options;
    return rtlRenderHook(renderCallback, { wrapper: composeWrapper(wrapper), ...rest });
};

export * from '@testing-library/react';
export { customRenderHook as renderHook };
export { customRender as render };
