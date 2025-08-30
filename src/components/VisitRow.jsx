import React from 'react';
import { 
  TableCell, 
  Tooltip, 
  IconButton, 
  Checkbox,
  TableRow
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

// Format utilities
const formatDate = (dateString, language) => {
  if (!dateString) return 'N/A';
  const date = dayjs(dateString);
  if (language === 'ur') {
    return date.format('YYYY-MM-DD').replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }
  return date.format('YYYY-MM-DD');
};

const formatTime = (timeString, language) => {
  if (!timeString) return 'N/A';
  if (language === 'ur') {
    return timeString.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }
  return timeString;
};

const VisitRow = React.memo(({ 
  visit, 
  index, 
  isSelected, 
  onCheckboxClick, 
  onDelete, 
  page, 
  rowsPerPage, 
  isAdmin, 
  isOfficer, 
  officerName, 
  isLanguageChanging,
  exactOfficerMatch,
  preventClickDuringTransition,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isRtl = i18n.language === 'ur';
  const isPending = !visit.officerAnswer || visit.officerAnswer === t('pendingStatus');
  
  const renderCell = (value, type) => {
    if (!value) return 'N/A';
    switch(type) {
      case 'date':
        return formatDate(value, i18n.language);
      case 'time':
        return formatTime(value, i18n.language);
      case 'duration':
        const duration = i18n.language === 'ur' 
          ? value.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
          : value;
        return `${duration} ${t('minutesShort')}`;
      default:
        return value;
    }
  };
  
  // Pre-compute styles
  const tableStyles = {
    cell: {
      padding: '12px 10px',
      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f0f4f7'}`,
      color: theme.palette.text.primary,
      fontSize: '0.875rem',
      transition: 'all 0.2s ease-in-out',
      maxWidth: '150px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    textCell: {
      maxWidth: '120px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    numberCell: {
      width: '40px',
      textAlign: 'center',
      fontWeight: 600,
      color: theme.palette.mode === 'dark' ? '#40B5AD' : '#40B5AD',
    },
    phoneCell: {
      width: '100px',
    },
    dateCell: {
      width: '90px',
    },
    timeCell: {
      width: '70px',
    },
    durationCell: {
      width: '70px',
    },
    actionCell: {
      width: '110px',
      padding: '4px',
      display: 'flex',
      gap: '2px',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }
  };
  
  // Format number for display
  const formatNumber = (num) => {
    if (i18n.language === 'ur') {
      return String(num).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    }
    return num;
  };
  
  return (
    <TableRow
      hover
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={-1}
      key={visit.id}
      selected={isSelected}
      style={{
        cursor: 'pointer',
        backgroundColor: isPending 
          ? (theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.03)')
          : (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)'),
        transition: 'all 0.15s ease-in-out',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 1px 3px rgba(0, 0, 0, 0.3)' 
          : '0 1px 3px rgba(0, 0, 0, 0.05)',
        borderRadius: '8px',
        margin: '8px 0',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}`,
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={isSelected}
          onClick={() => onCheckboxClick(visit.id)}
        />
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, ...tableStyles.numberCell }}>
        {formatNumber((page * rowsPerPage) + index + 1)}
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, maxWidth: '120px' }}>
        <Tooltip title={visit?.name || 'N/A'} arrow>
          <span>{visit?.name || 'N/A'}</span>
        </Tooltip>
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, ...tableStyles.phoneCell }}>{visit?.phone || 'N/A'}</TableCell>
      <TableCell style={{ ...tableStyles.cell, maxWidth: '150px' }}>
        <Tooltip title={visit?.address || 'N/A'} arrow>
          <span>{visit?.address || 'N/A'}</span>
        </Tooltip>
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, ...tableStyles.dateCell }}>
        {renderCell(visit?.date, 'date')}
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, ...tableStyles.timeCell }}>
        {renderCell(visit?.timeIn, 'time')}
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, ...tableStyles.timeCell }}>
        {renderCell(visit?.timeOut, 'time')}
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, ...tableStyles.durationCell }}>
        {renderCell(visit?.duration, 'duration')}
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, maxWidth: '150px' }}>
        <Tooltip title={visit?.officerName || 'N/A'} arrow>
          <span>{visit?.officerName || 'N/A'}</span>
        </Tooltip>
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, maxWidth: '150px' }}>
        <Tooltip title={visit?.userQuestion || 'N/A'} arrow>
          <span>{visit?.userQuestion || 'N/A'}</span>
        </Tooltip>
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, ...tableStyles.dateCell }}>
        {renderCell(visit?.responseDate, 'date')}
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, maxWidth: '150px' }}>
        <Tooltip title={visit?.officerAnswer || 'N/A'} arrow>
          <span>{visit?.officerAnswer || 'N/A'}</span>
        </Tooltip>
      </TableCell>
      <TableCell style={{ ...tableStyles.cell, ...tableStyles.actionCell }}>
        <div className="action-buttons" style={{ display: 'flex', gap: '6px' }}>
          <Tooltip title={t('viewDetails')} arrow>
            <IconButton
              component={Link}
              to={`/visit/${visit.id}`}
              color="primary"
              size="small"
              onClick={preventClickDuringTransition}
              disabled={isLanguageChanging}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                padding: '6px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(25, 118, 210, 0.15)'
                }
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Only show edit button for admin or if officer owns this visit */}
          {(isAdmin || (isOfficer && exactOfficerMatch(visit.officerName, officerName))) && (
            <Tooltip title={t('edit')} arrow>
              <IconButton
                component={Link}
                to={`/edit/${visit.id}`}
                color="info"
                size="small"
                onClick={preventClickDuringTransition}
                disabled={isLanguageChanging}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(3, 169, 244, 0.1)' : 'rgba(3, 169, 244, 0.05)',
                  padding: '6px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(3, 169, 244, 0.2)' : 'rgba(3, 169, 244, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.palette.mode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(3, 169, 244, 0.15)'
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Only show delete button for admin or if officer owns this visit */}
          {(isAdmin || (isOfficer && exactOfficerMatch(visit.officerName, officerName))) && (
            <Tooltip title={t('delete')} arrow>
              <IconButton
                color="error"
                size="small"
                onClick={(e) => {
                  preventClickDuringTransition(e);
                  if (!isLanguageChanging && window.confirm(t('confirmDelete'))) {
                    onDelete(visit.id);
                  }
                }}
                disabled={isLanguageChanging}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                  padding: '6px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.palette.mode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(244, 67, 54, 0.15)'
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo optimization
  return (
    prevProps.visit.id === nextProps.visit.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isLanguageChanging === nextProps.isLanguageChanging &&
    prevProps.page === nextProps.page &&
    prevProps.rowsPerPage === nextProps.rowsPerPage
  );
});

export default VisitRow; 