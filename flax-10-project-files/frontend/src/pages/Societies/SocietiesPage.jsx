/*
 * SocietiesPage wires the societies page state to its presentational layout.
 */
import { useSocietiesPage } from "./societiesPageState";
import { SocietiesPageContent } from "./SocietiesPageContent";

export default function SocietiesPage() {
    const state = useSocietiesPage();
    return <SocietiesPageContent state={state} />;
}
