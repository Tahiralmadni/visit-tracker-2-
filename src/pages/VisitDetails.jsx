import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Typography, Button, Container } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function VisitDetails({ visit }) {
  const navigate = useNavigate();

  console.log("VisitDetails component received visit:", visit);

  if (!visit) return <div>Visit not found</div>;

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>Visit Details</Typography>
        <Typography><strong>Client Name:</strong> {visit.name}</Typography>
        <Typography><strong>Contact Number:</strong> {visit.phone}</Typography>
        <Typography><strong>Address:</strong> {visit.address}</Typography>
        <Typography><strong>Date of Visit:</strong> {visit.date}</Typography>
        <Typography><strong>Time In:</strong> {visit.timeIn}</Typography>
        <Typography><strong>Time Out:</strong> {visit.timeOut}</Typography>
        <Typography><strong>Duration:</strong> {visit.duration} mins</Typography>
        <Typography><strong>Question:</strong> {visit.userQuestion}</Typography>
        <Typography><strong>Officer Response Date:</strong> {visit.responseDate}</Typography>
        <Typography><strong>Officer Answer:</strong> {visit.officerAnswer}</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Container>
  );
}

export default VisitDetails;
