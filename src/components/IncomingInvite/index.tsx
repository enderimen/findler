import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useRoom } from "@/hooks/useRoom";
import { gameApi, socket } from "@/services/socket/game";
import { useAppDispatch } from "@/store/hooks";
import { pushNotice } from "@/store/slices/game";
import { IncomingInvite as Invite } from "@/types/game";
import { MODE_LABELS, SYMBOL_LABELS, turnSecondsLabel } from "@/utils/constants/gameSettings";
import { getProfile, handleApiError } from "@/utils/helpers";

// Cevaplanmayan davet bu süreden sonra kendiliğinden kapanır
const INVITE_TIMEOUT_MS = 30000;

// Başka bir oyuncudan gelen oyun davetini sitenin her yerinde gösterir
function IncomingInvite() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { joinRoom } = useRoom();
  const [invite, setInvite] = useState<Invite | null>(null);

  useEffect(() => {
    const onInvite = (incoming: Invite) => setInvite(incoming);
    socket.on("invite:incoming", onInvite);
    return () => {
      socket.off("invite:incoming", onInvite);
    };
  }, []);

  useEffect(() => {
    if (!invite) return;
    const timer = setTimeout(() => setInvite(null), INVITE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [invite]);

  const decline = useCallback(() => {
    if (invite) gameApi.declineInvite(invite.fromId);
    setInvite(null);
  }, [invite]);

  const accept = async () => {
    if (!invite) return;
    const { roomId } = invite;
    setInvite(null);
    const profile = getProfile();
    // Adı kayıtlı değilse davet kartı adını sorar
    if (!profile) {
      navigate(`/oda/${roomId}`);
      return;
    }
    try {
      await joinRoom(roomId, profile);
      navigate(`/oda/${roomId}`);
    } catch (error) {
      dispatch(pushNotice({ message: handleApiError(error), type: "error" }));
    }
  };

  const summary = invite
    ? [
        MODE_LABELS[invite.settings.mode],
        SYMBOL_LABELS[invite.settings.symbols],
        `${invite.settings.cardCount} kart`,
        turnSecondsLabel(invite.settings.turnSeconds),
      ].join(" · ")
    : "";

  return (
    <AnimatePresence>
      {invite && (
        <ConfirmDialog
          title="Oyun daveti"
          message={`${invite.fromName} seni oyuna davet ediyor (${invite.playerCount}/${invite.maxPlayers} oyuncu). ${summary}`}
          confirmLabel="Katıl"
          cancelLabel="Reddet"
          onConfirm={accept}
          onCancel={decline}
        />
      )}
    </AnimatePresence>
  );
}

export default IncomingInvite;
