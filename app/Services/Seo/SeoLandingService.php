<?php

namespace App\Services\Seo;

use App\Enums\VideoStatus;
use App\Models\Category;
use App\Models\SeoLanding;
use App\Models\Video;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class SeoLandingService
{
    public function buildQuery(SeoLanding $landing): Builder
    {
        $params = $landing->params ?? [];

        $query = Video::query()
            ->where('status', VideoStatus::Published->value)
            ->withSum('viewsDaily', 'views')
            ->withCount('likes');

        $category = Arr::get($params, 'category');
        if ($category) {
            $query->where('category_slug', $category);
        }

        $tag = Arr::get($params, 'tag');
        if ($tag) {
            if (\Illuminate\Support\Facades\DB::getDriverName() === 'sqlite') {
                $query->whereRaw('raw_tags LIKE ?', ["%{$tag}%"]);
            } else {
                $query->whereRaw('? = ANY(raw_tags)', [$tag]);
            }
        }

        $duration = Arr::get($params, 'duration');
        if ($duration) {
            $durationConfig = config("seo_landings.durations.{$duration}");
            if ($durationConfig) {
                $query->whereNotNull('duration_seconds')
                    ->where('duration_seconds', '>=', (int) $durationConfig['min']);
                if ($durationConfig['max'] !== null) {
                    $query->where('duration_seconds', '<=', (int) $durationConfig['max']);
                }
            }
        }

        $timeframe = Arr::get($params, 'timeframe');
        if ($timeframe) {
            $timeframeConfig = config("seo_landings.timeframes.{$timeframe}");
            if ($timeframeConfig) {
                $query->where('published_at', '>=', now()->subDays((int) $timeframeConfig['days']));
            }
        }

        if ($landing->type === 'top') {
            $query->orderByDesc('views_daily_sum_views');
        } else {
            $query->orderByDesc('published_at');
        }

        return $query;
    }

    public function renderTitle(SeoLanding $landing): string
    {
        return $this->replaceTokens($landing->title_template, $landing);
    }

    public function renderDescription(SeoLanding $landing): string
    {
        return $this->replaceTokens($landing->description_template, $landing);
    }

    /**
     * @return array<int, array{question: string, answer: string}>
     */
    public function renderFaq(SeoLanding $landing): array
    {
        $templates = $landing->faq_template ?: config('seo_landings.faq_templates', []);

        return collect($templates)
            ->map(function ($row) use ($landing) {
                return [
                    'question' => $this->replaceTokens((string) ($row['question'] ?? ''), $landing),
                    'answer' => $this->replaceTokens((string) ($row['answer'] ?? ''), $landing),
                ];
            })
            ->filter(fn ($row) => $row['question'] !== '' && $row['answer'] !== '')
            ->values()
            ->all();
    }

    public function tokensForLanding(SeoLanding $landing): array
    {
        $params = $landing->params ?? [];
        $categorySlug = Arr::get($params, 'category');
        $tag = Arr::get($params, 'tag');
        $duration = Arr::get($params, 'duration');
        $timeframe = Arr::get($params, 'timeframe');

        $categoryLabel = $categorySlug
            ? (Category::query()->where('slug', $categorySlug)->value('name') ?: Str::headline($categorySlug))
            : 'todas las categorías';

        $durationLabel = $duration
            ? (config("seo_landings.durations.{$duration}.label") ?? $duration)
            : 'destacados';

        $timeframeLabel = $timeframe
            ? (config("seo_landings.timeframes.{$timeframe}.label") ?? $timeframe)
            : 'recientes';

        return [
            '{category}' => $categoryLabel,
            '{tag}' => $tag ? Str::headline($tag) : 'tendencias',
            '{duration}' => $durationLabel,
            '{timeframe}' => $timeframeLabel,
            '{language}' => $landing->language ?? 'es',
        ];
    }

    private function replaceTokens(string $template, SeoLanding $landing): string
    {
        $tokens = $this->tokensForLanding($landing);

        return str_replace(array_keys($tokens), array_values($tokens), $template);
    }
}
