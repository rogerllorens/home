<?php

namespace App\Enums;

enum ImportRunStatus: string
{
    case Pending = 'pending';
    case Running = 'running';
    case Success = 'success';
    case Failed = 'failed';
}
