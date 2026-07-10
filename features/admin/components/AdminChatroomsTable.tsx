'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Users, Loader2, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useGetRooms } from '../api/use-get-rooms';
import { useGetRoomMembers } from '../api/use-get-room-members';
import { useDeleteRoom } from '../api/use-delete-room';
import type { AdminRoom } from '../types/admin';

const PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function AdminChatroomsTable() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromToken, setFromToken] = useState<string | undefined>(undefined);
  const [accumulated, setAccumulated] = useState<AdminRoom[]>([]);
  const [membersRoom, setMembersRoom] = useState<AdminRoom | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<AdminRoom | null>(null);

  // Debounce the search term so typing doesn't spam the API.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setFromToken(undefined);
      setAccumulated([]);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, error, isFetching } = useGetRooms(
    {
      limit: PAGE_SIZE,
      from_token: fromToken,
      search_term: searchTerm || undefined,
    },
    true,
  );

  // Merge the latest page into the accumulated list. Reset on new search.
  useEffect(() => {
    if (!data) return;
    setAccumulated((prev) => {
      if (!fromToken) return data.rooms;
      return [...prev, ...data.rooms];
    });
  }, [data, fromToken]);

  const deleteRoomMutation = useDeleteRoom();
  const membersQuery = useGetRoomMembers(
    membersRoom?.room_id,
    !!membersRoom,
  );

  const rooms = accumulated;
  const totalRooms = data?.total_rooms ?? 0;
  const hasNext = !!data?.next_batch;

  const handleLoadMore = () => {
    if (data?.next_batch) setFromToken(data.next_batch);
  };

  const confirmDelete = () => {
    if (!deleteRoom) return;
    deleteRoomMutation.mutate(
      { roomId: deleteRoom.room_id, purge: true },
      {
        onSettled: () => setDeleteRoom(null),
      },
    );
  };

  const tableBody = useMemo(() => {
    if (isLoading && rooms.length === 0) {
      return (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…
        </div>
      );
    }
    if (error) {
      return (
        <div className="py-10 text-center text-sm text-destructive">
          {error.message}
        </div>
      );
    }
    if (rooms.length === 0) {
      return (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No rooms found.
        </div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Alias</th>
              <th className="px-4 py-3 text-center">Members</th>
              <th className="px-4 py-3 text-center">Visibility</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr
                key={room.room_id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {room.name || <span className="text-muted-foreground">Untitled</span>}
                  </div>
                  <code className="text-xs text-muted-foreground">
                    {room.room_id}
                  </code>
                </td>
                <td className="px-4 py-3">
                  {room.canonical_alias ? (
                    <code className="text-xs">{room.canonical_alias}</code>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {room.joined_members ?? room.members ?? 0}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={room.is_public ? 'secondary' : 'outline'}>
                    {room.is_public ? 'Public' : 'Private'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setMembersRoom(room)}
                    >
                      <Users className="h-4 w-4" /> Members
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteRoom(room)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [isLoading, error, rooms]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Matrix chatrooms</h1>
          <p className="text-sm text-muted-foreground">
            Manage Synapse rooms. Delete also purges room history.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {totalRooms} room{totalRooms === 1 ? '' : 's'} on server
        </span>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by room name or alias…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rooms</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tableBody}
          {hasNext && (
            <div className="flex items-center justify-center border-t px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </>
                ) : (
                  <>
                    Load more <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members dialog */}
      <Dialog
        open={!!membersRoom}
        onOpenChange={(o) => !o && setMembersRoom(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Room members</DialogTitle>
            <DialogDescription>
              {membersRoom?.name || membersRoom?.room_id}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {membersQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
              </div>
            ) : membersQuery.error ? (
              <p className="py-6 text-center text-sm text-destructive">
                {membersQuery.error.message}
              </p>
            ) : membersQuery.data?.members?.length ? (
              <ul className="flex flex-col gap-1">
                {membersQuery.data.members.map((mxid) => (
                  <li
                    key={mxid}
                    className="rounded-md border border-border bg-muted/30 px-3 py-2"
                  >
                    <code className="text-xs">{mxid}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No members found.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteRoom}
        onOpenChange={(o) => !o && setDeleteRoom(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes <code>{deleteRoom?.room_id}</code> and purges its
              history from Synapse. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteRoomMutation.isPending}
            >
              {deleteRoomMutation.isPending ? 'Deleting…' : 'Delete + purge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
