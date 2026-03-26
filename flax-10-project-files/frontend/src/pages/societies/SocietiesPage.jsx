/*
 * SocietiesPage wires the societies page state to its presentational layout.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useSocietiesPage } from "./societiesPageState";
import { SocietiesPageContent } from "./SocietiesPageContent";

export default function SocietiesPage() {
    const state = useSocietiesPage();
    return <SocietiesPageContent state={state} />;
}
