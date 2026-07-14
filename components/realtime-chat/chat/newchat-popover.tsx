import { memo, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ArrowLeft, PenBoxIcon, Search, UsersIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { useRouter } from "next/navigation";
import { Spinner } from "../ui/spinner";
import type { UserType } from "@/features/chat/types/auth.type";
import AvatarWithBadge from "../avatar-with-badge";
import { Checkbox } from "../ui/checkbox";
import { useGetAdminUsers } from "@/features/users-list/api/use-get-users";
import { useCreateRoom } from "@/features/chat/api/use-craete-room";
import { useCreateGroup } from "@/features/chat/api/use-create-group";
import { usePatients } from "@/features/patients-list/api/useGetPatients";
import { useChatContacts } from "@/features/chat/api/use-get-contacts";
import { useUser } from "@/context/UserContext";

export const NewChatPopover = memo(() => {
  const createRoomMutation = useCreateRoom();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const createGroupMutation = useCreateGroup();

  const [isOpen, setIsOpen] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const { user } = useUser();
  const role = user?.role || "";

  const adminUsers = useGetAdminUsers(role === "admin");
  const patients = usePatients(
    true,
    role === "doctor" || role === "caregiver"
  );
  const contacts = useChatContacts(role === "patient");

  const SharedUsers = useMemo(() => {
    if (role === "admin") return adminUsers.data;
    if (role === "patient") return contacts.data;
    return patients.data;
  }, [role, adminUsers.data, contacts.data, patients.data]);

  const isLoading =
    role === "admin"
      ? adminUsers.isLoading
      : role === "patient"
        ? contacts.isLoading
        : patients.isLoading;


  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  const handleBack = () => {
    resetState();
  };

  const resetState = () => {
    setIsGroupMode(false);
    setGroupName("");
    setSelectedUsers([]);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    resetState();
  };
  

const handleCreateGroup = async () => {
  console.log("handleCreateGroup called", { groupName, selectedUsers });

  if (!groupName.trim() || selectedUsers.length === 0) {
    console.warn("Group name or selected users are missing", { groupName, selectedUsers });
    return;
  }

  try {
    console.log("Calling mutateAsync...");
    const response = await createGroupMutation.mutateAsync({
      room_name: groupName,
      topic: "General discussion",
      invites: selectedUsers,
      is_public: false,
      room_alias: groupName.replace(/\s+/g, "_").toLowerCase(),
    });
    console.log("Group created:", response);

    setIsOpen(false);
    resetState();

    router.push(`dashboard/chat/${response.room_id}`);
  } catch (error) {
    console.error("Group creation failed:", error);
  }
};


  const handleCreateChat = async (userId: string) => {
    setLoadingUserId(userId);
    try {
      const response = await createRoomMutation.mutateAsync({
        target_username: `${userId}`,
        room_name: `${userId}`,
        topic: 'General_discussion',
      });

      console.log("response:", response);
      
      setIsOpen(false);
      resetState();
    } finally {
      setLoadingUserId(null);
      setIsOpen(false);
      resetState();
    }
  };



  const filteredUsers = SharedUsers?.filter((user: UserType) =>
  user.username.toLowerCase().includes(search.toLowerCase())
    );



  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          onClick={() => setIsOpen(true)}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <PenBoxIcon className="!h-5 !w-5 !stroke-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 z-[999] p-0
         rounded-xl min-h-[400px]
         max-h-[80vh] flex flex-col
        "
      >
        <div className="border-b p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {isGroupMode && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft size={16} />
              </Button>
            )}
            <h3 className="text-lg font-semibold">
              {isGroupMode || user.role === "admin" ?"New Group" : "New Chat"}
            </h3>
          </div>

          <InputGroup>
            <InputGroupInput
              value={isGroupMode ? groupName : search}
              onChange={(e) =>
                isGroupMode ? setGroupName(e.target.value) : setSearch(e.target.value)
              }
              placeholder={isGroupMode || user.role === "admin" ? "Enter group name" : "Search name"}
            />
            <InputGroupAddon>
              {isGroupMode ? <UsersIcon /> : <Search />}
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div
          className="flex-1 justify-center overflow-y-auto
         px-1 py-1 space-y-1
        "
        >
          {isLoading ? (
            <Spinner className="w-6 h-6" />
          ) : filteredUsers && filteredUsers?.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No users found
            </div>
          ) : !isGroupMode ? (
            <>
            {user.role === "admin" &&
              <NewGroupItem
                disabled={false}
                onClick={() => setIsGroupMode(true)}
              />}
              {filteredUsers?.map((user: UserType) => (
                <ChatUserItem
                  key={user.id}
                  user={user}
                  isLoading={loadingUserId === user.id}
                  disabled={loadingUserId !== null}
                  onClick={handleCreateChat}
                />
              ))}
            </>
          ) : (
            filteredUsers?.map((user: UserType) => (
              <GroupUserItem
                key={user.id}
                user={user}
                isSelected={selectedUsers.includes(user.username)}
                onToggle={toggleUserSelection}
              />
            ))
          )}
        </div>

        {isGroupMode && (
          <div className="border-t p-3">
            <Button
              onClick={handleCreateGroup}
              className="w-full"

            >
              {/* {createGroupMutation.isLoading && <Spinner className="w-4 h-4" />} */}
              Create Group
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
});
NewChatPopover.displayName = "NewChatPopover";

const UserAvatar = memo(({ user }: { user: UserType }) => (
  <>
    <AvatarWithBadge name={user.username} src={user.avatar ?? ""} />
    <div className="flex-1 min-w-0">
      <h5 className="text-[13.5px] font-medium truncate">{user.username}</h5>
      <p className="text-xs text-muted-foreground">Hey there! I'm using chat</p>
    </div>
  </>
));

UserAvatar.displayName = "UserAvatar";

const NewGroupItem = memo(
  ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center
       gap-2 p-2 rounded-sm hover:bg-accent
       transition-colors text-left disabled:opacity-50
      "
    >
      <div className="bg-primary/10 p-2 rounded-full">
        <UsersIcon className="size-4 text-primary" />
      </div>
      <span>New Group</span>
    </button>
  )
);

NewGroupItem.displayName = "NewGroupItem";

const ChatUserItem = memo(
  ({
    user,
    isLoading,
    disabled,
    onClick,
  }: {
    user: UserType;
    disabled: boolean;
    isLoading: boolean;
    onClick: (id: string) => void;
  }) => (
    <button
      className="
      relative w-full flex items-center gap-2 p-2
    rounded-sm hover:bg-accent
       transition-colors text-left disabled:opacity-50"
      disabled={isLoading || disabled}
      onClick={() => onClick(user.username)}
    >
      <UserAvatar user={user} />
      {isLoading && <Spinner className="absolute right-2 w-4 h-4 ml-auto" />}
    </button>
  )
);

ChatUserItem.displayName = "ChatUserItem";

const GroupUserItem = memo(
  ({
    user,
    isSelected,
    onToggle,
  }: {
    user: UserType;
    isSelected: boolean;
    onToggle: (id: string) => void;
  }) => (
    <div
      role="button"
      className="w-full flex items-center gap-2 p-2
      rounded-sm hover:bg-accent
       transition-colors text-left
      "
    >
      <UserAvatar user={user} />
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(user.username)}
      />
    </div>
  )
);

GroupUserItem.displayName = "GroupUserItem";
