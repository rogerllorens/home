<?php

namespace App\Enums;

enum VideoStatus: string
{
    case Draft = 'draft';
    case Ready = 'ready';
    case Published = 'published';
    case Broken = 'broken';
    case Quarantine = 'quarantine';
    case AiDone = 'ai_done';
    case Archived = 'archived';
}
