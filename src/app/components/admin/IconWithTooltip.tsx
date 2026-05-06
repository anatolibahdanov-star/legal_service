"use client"

import React from 'react';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ErrorIcon from '@mui/icons-material/Error';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import GppBadIcon from '@mui/icons-material/GppBad';
import PendingIcon from '@mui/icons-material/Pending';
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import NoAccountsIcon from '@mui/icons-material/NoAccounts';
import BlockIcon from '@mui/icons-material/Block';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { Tooltip } from "@/src/app/components/Tooltip";
import LooksOneIcon from '@mui/icons-material/LooksOne';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaidIcon from '@mui/icons-material/Paid';
import TextIncreaseIcon from '@mui/icons-material/TextIncrease';
import TextDecreaseIcon from '@mui/icons-material/TextDecrease';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PanToolIcon from '@mui/icons-material/PanTool';
import AutofpsSelectIcon from '@mui/icons-material/AutofpsSelect';

export const IconWithTooltip = (id: string, tip: string): React.ReactNode => {
    let icon: React.ReactNode = ""
    switch (id) {
        case "New":
            icon = <FiberNewIcon sx={{ color: '#f59e0b' }} />
            break;
        case "Lawyer":
            icon = <PersonOutlineIcon sx={{ color: '#f59e0b' }} />
            break;
        case "None":
            icon = <CheckBoxOutlineBlankIcon sx={{ color: '#9e9a9a' }} />
            break;
        case "NotActivated":
            icon = <NoAccountsIcon sx={{ color: '#9e9a9a' }} />
            break;
        case "NotRegistered":
            icon = <AccountCircleIcon sx={{ color: '#9e9a9a' }} />
            break;
        case "Disabled":
            icon = <DisabledByDefaultIcon sx={{ color: '#9e9a9a' }} />
            break;
        case "Sent":
            icon = <CheckBoxIcon sx={{ color: '#10b981' }} />
            break;
        case "Approved":
            icon = <ThumbUpAltIcon sx={{ color: '#10b981' }} />
            break;
        case "Activated":
            icon = <HowToRegIcon sx={{ color: '#10b981' }} />
            break;
        case "Registered":
            icon = <AccountCircleIcon sx={{ color: '#10b981' }} />
            break;
        case "SuperAdmin":
            icon = <SupervisorAccountIcon sx={{ color: '#10b981' }} />
            break;
        case "InProgress":
            icon = <PendingIcon sx={{ color: '#3b82f6' }} />
            break;
        case "Error": 
            icon = <ErrorIcon sx={{ color: '#ef4444' }} />
            break;
        case "Banned": 
            icon = <BlockIcon sx={{ color: '#ef4444' }} />
            break;
        case "Spam": 
            icon = <GppBadIcon sx={{ color: '#ef4444' }} />
            break;
        case "Paid": 
            icon = <PaidIcon sx={{ color: '#10b981' }} />
            break;
        case "Unpaid": 
            icon = <PaidIcon sx={{ color: '#ef4444' }} />
            break;
        case "OneTime": 
            icon = <LooksOneIcon sx={{ color: '#3b82f6' }} />
            break;
        case "Balance": 
            icon = <AccountBalanceWalletIcon sx={{ color: '#f59e0b' }} />
            break;
        case "Increase": 
            icon = <TextIncreaseIcon sx={{ color: '#10b981' }} />
            break;
        case "Decrease": 
            icon = <TextDecreaseIcon sx={{ color: '#ef4444' }} />
            break;
        case "Success": 
            icon = <CheckCircleIcon sx={{ color: '#10b981' }} />
            break;
        case "Manual": 
            icon = <PanToolIcon sx={{ color: '#3b82f6' }} />
            break;
        case "Auto": 
            icon = <AutofpsSelectIcon sx={{ color: '#f59e0b' }} />
            break;
        default:
            icon = <ErrorIcon sx={{ color: '#ef4444' }} />
            break;
    }

    return (
        <Tooltip content={tip}>{icon}</Tooltip>
    )
}