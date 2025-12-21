<?php

namespace App\Enums;

enum SourceType: string
{
    case Manual = 'manual';
    case FeedJson = 'feed_json';
    case FeedXml = 'feed_xml';
}
