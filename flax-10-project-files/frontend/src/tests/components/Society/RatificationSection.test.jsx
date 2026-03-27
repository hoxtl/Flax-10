import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RatificationSection, RatificationToggle } from '../../../components/society/society_detail/RatificationSection';

vi.mock('../../../components/society/society_detail/RatificationSection.module.css', () => ({
    default: {
        section: 'section',
        title: 'title',
        statusApproved: 'approved',
        statusPending: 'pending',
        statusRejected: 'rejected',
        requestBtn: 'requestBtn',
        info: 'info',
        toggleSection: 'toggleSection',
        toggleRow: 'toggleRow',
        toggleLabel: 'toggleLabel',
        toggleHint: 'toggleHint',
        toggle: 'toggle',
        toggleOn: 'toggleOn',
        toggleKnob: 'toggleKnob',
        notice: 'notice',
        noticeIcon: 'noticeIcon',
    },
}));

describe('RatificationSection', () => {
    it('renders Ratified status when isRatified is true', () => {
        render(<RatificationSection isRatified={true} />);
        expect(screen.getByText('Ratification Status')).toBeInTheDocument();
        expect(screen.getByText('Ratified')).toBeInTheDocument();
    });

    it('renders Pending Approval when status is pending', () => {
        render(<RatificationSection status="pending" isRatified={false} />);
        expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    });

    it('renders Rejected with Request Again button when status is rejected', () => {
        const onRequest = vi.fn();
        render(<RatificationSection status="rejected" isRatified={false} onRequest={onRequest} />);
        expect(screen.getByText('Rejected')).toBeInTheDocument();
        const btn = screen.getByText('Request Again');
        fireEvent.click(btn);
        expect(onRequest).toHaveBeenCalled();
    });

    it('renders RatificationRequest with Request Ratification button by default', () => {
        const onRequest = vi.fn();
        render(<RatificationSection isRatified={false} onRequest={onRequest} />);
        expect(screen.getByText('Ratification')).toBeInTheDocument();
        expect(screen.getByText(/Request ratification to gain official society status/)).toBeInTheDocument();
        const btn = screen.getByText('Request Ratification');
        fireEvent.click(btn);
        expect(onRequest).toHaveBeenCalled();
    });
});

describe('RatificationToggle', () => {
    it('renders toggle and calls onToggle when clicked', () => {
        const onToggle = vi.fn();
        render(<RatificationToggle requested={false} onToggle={onToggle} />);
        expect(screen.getByText('Request Ratification')).toBeInTheDocument();
        expect(screen.getByText(/Ratified societies are officially recogni/)).toBeInTheDocument();
        const btn = screen.getByRole('button', { type: 'button' });
        fireEvent.click(btn);
        expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('when requested is true, clicking toggles to false', () => {
        const onToggle = vi.fn();
        render(<RatificationToggle requested={true} onToggle={onToggle} />);
        const btn = screen.getByRole('button', { type: 'button' });
        fireEvent.click(btn);
        expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('shows RatificationNotice when requested is true', () => {
        render(<RatificationToggle requested={true} onToggle={vi.fn()} />);
        expect(screen.getByText(/Ratification requires admin approval/)).toBeInTheDocument();
    });
});
