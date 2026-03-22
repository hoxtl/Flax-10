/*
 * Home address settings form.
 */
import SectionSkeleton from "../Common/LoadingState/SectionSkeleton";
import HomeAddressFormLayout from "./HomeAddressFormLayout";
import useHomeAddressForm from "./home/useHomeAddressForm";

export default function HomeAddressForm({ onSave, isSaving, error }) {
  const form = useHomeAddressForm();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await onSave(form.homeAddress);
    if (ok) form.markSaved();
  };

  if (form.loading) return <SectionSkeleton label="Loading home address" rows={1} />;

  return <HomeAddressFormLayout onSubmit={handleSubmit} homeAddress={form.homeAddress} setHomeAddress={form.setHomeAddress} error={error} isSaving={isSaving} hasUnsaved={form.hasUnsaved} saveSignal={form.saveSignal} />;
}
