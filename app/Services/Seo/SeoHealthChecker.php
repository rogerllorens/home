<?php

namespace App\Services\Seo;

use App\Models\Category;
use App\Models\SeoHealthIssue;
use App\Models\SeoLanding;
use App\Models\TopicCluster;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class SeoHealthChecker
{
    public function run(): Collection
    {
        $issues = collect();
        $titleMin = (int) config('candidboys.seo.title_min', 40);
        $titleMax = (int) config('candidboys.seo.title_max', 70);
        $descMin = (int) config('candidboys.seo.desc_min', 120);
        $descMax = (int) config('candidboys.seo.desc_max', 160);

        $pages = $this->pages();
        $sitemapUrls = $this->sitemapUrls();

        foreach ($pages as $page) {
            if ($page['title'] === '') {
                $issues->push($this->issue($page, 'missing_title', 'high'));
            }

            if ($page['description'] === '') {
                $issues->push($this->issue($page, 'missing_description', 'high'));
            }

            if ($page['title'] !== '' && (mb_strlen($page['title']) < $titleMin || mb_strlen($page['title']) > $titleMax)) {
                $issues->push($this->issue($page, 'title_length', 'medium'));
            }

            if ($page['description'] !== '' && (mb_strlen($page['description']) < $descMin || mb_strlen($page['description']) > $descMax)) {
                $issues->push($this->issue($page, 'description_length', 'medium'));
            }

            if ($page['url'] === '') {
                $issues->push($this->issue($page, 'missing_canonical', 'high'));
            }

            if (!empty($sitemapUrls) && !in_array($page['url'], $sitemapUrls, true)) {
                $issues->push($this->issue($page, 'missing_sitemap', 'medium'));
            }
        }

        SeoHealthIssue::query()->update(['status' => 'resolved']);

        foreach ($issues as $issue) {
            SeoHealthIssue::updateOrCreate([
                'page_type' => $issue['page_type'],
                'url' => $issue['url'],
                'issue_type' => $issue['issue_type'],
            ], [
                'severity' => $issue['severity'],
                'status' => 'new',
            ]);
        }

        return SeoHealthIssue::query()->where('status', 'new')->get();
    }

    private function pages(): array
    {
        $pages = [];

        Category::query()
            ->where('is_public', true)
            ->get(['id', 'slug', 'name'])
            ->each(function (Category $category) use (&$pages) {
                $title = Str::limit("{$category->name} | Candid Boys", (int) config('candidboys.seo.title_max', 70), '');
                $description = config('candidboys.taxonomy_intros.categories.' . $category->slug, '')
                    ?: "Últimos videos en la categoría {$category->name}.";

                $pages[] = [
                    'page_type' => 'category',
                    'url' => route('public.category', $category->slug),
                    'title' => $title,
                    'description' => $description,
                ];
            });

        $tags = app(SeoDecayService::class)->allTags();
        foreach ($tags as $tag) {
            $title = Str::limit(Str::headline($tag) . ' | Candid Boys', (int) config('candidboys.seo.title_max', 70), '');
            $description = config('candidboys.taxonomy_intros.tags.' . $tag, '')
                ?: "Videos destacados con el tag {$tag}.";

            $pages[] = [
                'page_type' => 'tag',
                'url' => route('public.tag', $tag),
                'title' => $title,
                'description' => $description,
            ];
        }

        SeoLanding::query()
            ->where('is_public', true)
            ->get()
            ->each(function (SeoLanding $landing) use (&$pages) {
                $url = $landing->type === 'top'
                    ? route('public.seo.top', [
                        'category' => $landing->params['category'] ?? 'all',
                        'duration' => $landing->params['duration'] ?? 'short',
                        'timeframe' => $landing->params['timeframe'] ?? 'this-week',
                    ])
                    : route('public.discover', $landing->slug);

                $pages[] = [
                    'page_type' => 'seo_landing',
                    'url' => $url,
                    'title' => $landing->title_template,
                    'description' => $landing->description_template,
                ];
            });

        TopicCluster::query()
            ->where('is_public', true)
            ->get(['slug', 'name', 'intro'])
            ->each(function (TopicCluster $cluster) use (&$pages) {
                $pages[] = [
                    'page_type' => 'theme',
                    'url' => route('public.theme', $cluster->slug),
                    'title' => $cluster->name,
                    'description' => $cluster->intro ?? '',
                ];
            });

        foreach (config('candidboys.articles', []) as $article) {
            if (empty($article['slug'])) {
                continue;
            }

            $pages[] = [
                'page_type' => 'article',
                'url' => route('public.articles.show', $article['slug']),
                'title' => $article['title'] ?? '',
                'description' => $article['summary'] ?? '',
            ];
        }

        return $pages;
    }

    private function sitemapUrls(): array
    {
        $path = public_path('sitemaps/index.xml');
        if (!File::exists($path)) {
            return [];
        }

        $content = File::get($path);
        preg_match_all('/<loc>(.*?)<\/loc>/', $content, $matches);

        return collect($matches[1] ?? [])->unique()->values()->all();
    }

    private function issue(array $page, string $issueType, string $severity): array
    {
        return [
            'page_type' => $page['page_type'],
            'url' => $page['url'],
            'issue_type' => $issueType,
            'severity' => $severity,
        ];
    }
}
