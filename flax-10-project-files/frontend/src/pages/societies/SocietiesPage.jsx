/*
 * SocietiesPage wires the societies page state to its presentational layout.
 */

import { useSocietiesPage } from "./hooks/societiesPageState";
import { SocietiesPageContent } from "./components/SocietiesPageContent";

export default function SocietiesPage() {
    const state = useSocietiesPage();
    return <SocietiesPageContent state={state} />;
}
