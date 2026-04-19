import React, { useRef, useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from '@mui/material';
import VisitRow from './VisitRow';

// Regular table without virtualization
const VirtualTable = ({
  visits = [],
  tableStyles,
  rowHeight = 64,
  maxHeight = 600,
  selected = [],
  handleCheckboxClick,
  handleDelete,
  isAdmin,
  isOfficer,
  officerName,
  isLanguageChanging,
  page,
  rowsPerPage,
  exactOfficerMatch,
  preventClickDuringTransition,
  columnHeaders
}) => {
  const containerRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(0);
  
  // Recalculate width when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setTableWidth(containerRef.current.clientWidth);
      }
    };
    
    handleResize(); // initial calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box ref={containerRef} sx={{ width: '100%', overflowX: 'auto' }}>
      <TableContainer
        component={Paper}
        style={{
          ...tableStyles?.container,
          width: '100%',
          maxHeight: maxHeight,
          overflowY: 'auto',
        }}
      >
        <Table style={{ ...tableStyles?.table, width: '100%' }}>
          <TableHead>
            <TableRow>
              {columnHeaders}
            </TableRow>
          </TableHead>

          <TableBody>
            {visits.length > 0 ? (
              visits.map((visit, index) => {
                const isItemSelected = selected.indexOf(visit.id) !== -1;
                
                return (
                  <VisitRow
                    key={visit.id}
                    visit={visit}
                    index={index}
                    isSelected={isItemSelected}
                    onCheckboxClick={handleCheckboxClick}
                    onDelete={handleDelete}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    isAdmin={isAdmin}
                    isOfficer={isOfficer}
                    officerName={officerName}
                    isLanguageChanging={isLanguageChanging}
                    exactOfficerMatch={exactOfficerMatch}
                    preventClickDuringTransition={preventClickDuringTransition}
                  />
                );
              })
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columnHeaders.length} 
                  align="center"
                  sx={{ textAlign: 'center !important' }}
                >
                  No visits found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default React.memo(VirtualTable); 