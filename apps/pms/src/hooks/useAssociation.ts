import { useContext } from "react";
import { AssociationContext } from "../components/contexts/association";

const useAssociation = () => useContext(AssociationContext);

export default useAssociation;
