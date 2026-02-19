'use client';

import { useEffect, useState } from 'react';
import {
  useQuery,
  useMutation,
  useSubscription,
  // gql,
} from '@apollo/client/react';
import { gql } from '@apollo/client';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { v4 as uuid } from 'uuid';
// import { NotificationAdd } from '@mui/icons-material';

type Notification = {
  id: string;
  recipient: string;
  channel: string;
  status: string;
  createdAt: string;
};

type GetLogsResponse = {
  notificationLogs: Notification[];
};

type SubscriptionResponse = {
  notificationProcessed: Notification;
};

const GET_LOGS = gql`
  query GetLogs {
    notificationLogs {
      id
      recipient
      channel
      status
      createdAt
    }
  }
`;

const SEND_NOTIFICATION = gql`
  mutation SendNotification(
    $recipient: String!
    $channel: String!
    $payload: JSON!
  ) {
    sendNotification(
      recipient: $recipient
      channel: $channel
      payload: $payload
    ) {
      success
    }
  }
`;

const NOTIFICATION_SUB = gql`
  subscription {
    notificationProcessed {
      id
      recipient
      channel
      status
      createdAt
    }
  }
`;

const columns: GridColDef[] = [
  { field: 'recipient', headerName: 'Recipient', flex: 1 },
  { field: 'channel', headerName: 'Channel', flex: 1 },
  { field: 'status', headerName: 'Status', flex: 1 },
  { field: 'createdAt', headerName: 'Time', flex: 1 },
];

export default function Page() {
  const [recipient, setRecipient] = useState('');
  const [channel, setChannel] = useState('EMAIL');
  const [rows, setRows] = useState<Notification[]>([]);

  const { data, loading, error } = useQuery<GetLogsResponse>(GET_LOGS);
  // const { data, loading, error } = useQuery<GetLogsResponse>(GET_LOGS, {
  //   onCompleted: (data) => {
  //     if(data?.notificationLogs) {
  //       setRows(data.notificationLogs)
  //     }
  //   },

  // });

  const [sendNotification, { loading: sending }] =
    useMutation(SEND_NOTIFICATION);

  // Initialize table data
  // useEffect(() => {
  //   if (data?.notificationLogs) {
  //     setRows(data.notificationLogs);
  //   }
  // }, [data]);

  // Subscription for real-time updates
  useSubscription<SubscriptionResponse>(NOTIFICATION_SUB, {
    onData: ({ data }) => {
      const notification = data.data?.notificationProcessed;
      if (!notification) return;

      setRows((prev) => {
        const exists = prev.some((r) => r.id === notification.id);
        if (exists) return prev;

        return [notification, ...prev];
      });
    },
  });

  const handleTrigger = async () => {
    if (!recipient.trim()) {
      alert('Recipient is required');
      return;
    }

    try {
      // Optimistic row
      const optimisticRow: Notification = {
        id: uuid(),
        recipient,
        channel,
        status: 'QUEUED',
        createdAt: new Date().toISOString(),
      };

      setRows((prev) => [optimisticRow, ...prev]);
      // setRows((prev) => prev.map(r => r.id === optimisticRow.id ? notification : r));

      await sendNotification({
        variables: {
          recipient,
          channel,
          payload: { msg: 'Hello World' },
        },
      });

      setRecipient('');
    } catch (err) {
      console.error(err);
      alert('Failed to send notification');
    }
  };

  if (loading) {
    return (
      <Box p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">
          Failed to load notifications
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={4} display="flex" flexDirection="column" gap={2}>
      <Box display="flex" gap={2}>
        <TextField
          label="Recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />

        <TextField
          select
          label="Channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <MenuItem value="EMAIL">Email</MenuItem>
          <MenuItem value="SMS">SMS</MenuItem>
        </TextField>

        <Button
          variant="contained"
          onClick={handleTrigger}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </Box>

      <Box height={500}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          pageSizeOptions = {[10,25,50]}
          initialState = {{
            pagination: {
              paginationModel: {pageSize: 10, page: 0},
            },
          }}
        />
      </Box>
    </Box>
  );
}  