import { FC } from "react";
import { HuddleRoom } from "./HuddleRoom";
import { useHuddleContext } from "../contexts/HuddleContext";

/**
 * PersistentHuddleRoom renders the HuddleRoom component at the app level
 * so it persists across clue navigation without unmounting/remounting.
 * It only shows when the user is on a clue page and has huddle info set.
 */
export const PersistentHuddleRoom: FC = () => {
  const { currentHuntId, currentTeamIdentifier, isInHunt } = useHuddleContext();

  // Only render HuddleRoom if we have the required info and user is on a clue page
  const shouldRender = isInHunt && currentHuntId && currentTeamIdentifier;

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <HuddleRoom huntId={currentHuntId} teamIdentifier={currentTeamIdentifier} />
    </div>
  );
};
