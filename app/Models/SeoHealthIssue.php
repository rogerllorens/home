<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeoHealthIssue extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_type',
        'url',
        'issue_type',
        'severity',
        'status',
    ];
}
