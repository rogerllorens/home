import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shimmer/shimmer.dart';
import 'package:local_auth/local_auth.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:fl_chart/fl_chart.dart';
import '../sb_cache.dart';
import 'dart:ui' as ui;
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:social_sharing_plus/social_sharing_plus.dart';
import '../main.dart';

import '../widgets/scanly_logo.dart';
import '../stats.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage>
    with SingleTickerProviderStateMixin {
  late Box box;
  final _auth = LocalAuthentication();
  late TabController _tabs;
  final Set<String> _filters = {}; // selected types
  bool _onlyUnsafe = false;
  String _range = 'Todos';
  String _sort = 'Reciente';
  final TextEditingController _searchController = TextEditingController();
  final GlobalKey _statsKey = GlobalKey();

  Icon _iconForType(String type) {
    switch (type) {
      case 'url':
        return const Icon(Icons.link);
      case 'wifi':
        return const Icon(Icons.wifi);
      case 'contact':
        return const Icon(Icons.contact_page);
      case 'tel':
        return const Icon(Icons.phone);
      case 'sms':
        return const Icon(Icons.sms);
      case 'geo':
        return const Icon(Icons.map);
      case 'email':
        return const Icon(Icons.email);
      case 'event':
        return const Icon(Icons.event);
      default:
        return const Icon(Icons.qr_code);
    }
  }

  Future<void> _exportStats() async {
    final boundary = _statsKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) return;
    final image = await boundary.toImage(pixelRatio: 3);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    if (bytes == null) return;
    final file = await File('${(await getTemporaryDirectory()).path}/stats_${DateTime.now().millisecondsSinceEpoch}.png').create();
    await file.writeAsBytes(bytes.buffer.asUint8List());
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text('Gráficos exportados en ${file.path}')));
  }

  Future<void> _shareEntry(String text) async {
    await showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Compartir'),
              onTap: () {
                Share.share(text);
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(Icons.whatsapp),
              title: const Text('WhatsApp'),
              onTap: () async {
                await SocialSharingPlus.shareToSocialMedia(
                  SocialPlatform.whatsapp,
                  text,
                  isOpenBrowser: false,
                  onAppNotInstalled: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('WhatsApp no instalado')),
                    );
                  },
                );
                if (context.mounted) Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(Icons.send),
              title: const Text('Telegram'),
              onTap: () async {
                await SocialSharingPlus.shareToSocialMedia(
                  SocialPlatform.telegram,
                  text,
                  isOpenBrowser: false,
                  onAppNotInstalled: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Telegram no instalado')),
                    );
                  },
                );
                if (context.mounted) Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<bool> _isUrlSafe(String url) async {
    if (!safeBrowsingNotifier.value) return true;
    final offline = offlineNotifier.value;
    return SafeBrowsingCache.checkUrl(url, offline: offline);
  }

  Future<bool> _confirmOpenUrl(String url, bool safe) async {
    return await showDialog<bool>(
          context: context,
          builder: (d) {
            final uri = Uri.tryParse(url);
            return AlertDialog(
              title: Row(
                children: [
                  const CodeMaster ProLogo(variant: LogoVariant.static, size: 24),
                  const SizedBox(width: 8),
                  Text(safe ? 'Enlace seguro' : 'Enlace peligroso'),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(url, style: const TextStyle(fontFamily: 'monospace')),
                  if (uri != null) ...[
                    const SizedBox(height: 8),
                    Text('Dominio: ${uri.host}'),
                  ],
                  if (!safe)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        '⚠️ Este enlace puede ser malicioso',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                ],
              ),
              actions: [
                TextButton(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: url));
                      Navigator.pop(d, null);
                    },
                    child: const Text('Copiar enlace')),
                TextButton(
                    onPressed: () => Navigator.pop(d, false),
                    child: const Text('Cancelar')),
                if (safe)
                  TextButton(
                      onPressed: () => Navigator.pop(d, true),
                      child: const Text('Abrir ahora')),
              ],
            );
          },
        ) ??
        false;
  }

  @override
  void initState() {
    super.initState();
    box = Hive.box('history');
    _tabs = TabController(length: 2, vsync: this);
    _authenticate();
    _refresh();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _authenticate() async {
    final available = await _auth.canCheckBiometrics || await _auth.isDeviceSupported();
    if (!available) return;
    final success = await _auth.authenticate(localizedReason: 'Desbloquear historial');
    if (!success && mounted) {
      Navigator.pop(context);
    }
  }

  Future<void> _refresh() async {
    if (!offlineNotifier.value && revalidateOnOpenNotifier.value) {
      final entries = box.toMap();
      for (final key in entries.keys) {
        final v = entries[key];
        if (v is Map && v['code'] is String && v['kind'] == 'scanned') {
          final code = v['code'] as String;
          final uri = Uri.tryParse(code);
          if (uri != null && uri.hasScheme) {
            final safe = await _isUrlSafe(code);
            final data = Map.of(v);
            data['safe'] = safe;
            data['checkTs'] = DateTime.now().toIso8601String();
            box.put(key, data);
          }
        }
      }
    }
    if (mounted) setState(() {});
  }

  void _openFilterSheet() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) {
        final types = [
          'url',
          'wifi',
          'contact',
          'tel',
          'sms',
          'geo',
          'email',
          'event',
          'text'
        ];
        return StatefulBuilder(
          builder: (context, setStateSheet) => Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 4,
                  children: types.map((t) {
                    final selected = _filters.contains(t);
                    return FilterChip(
                      label: Text(t),
                      selected: selected,
                      onSelected: (v) {
                        setState(() {
                          if (v) {
                            _filters.add(t);
                          } else {
                            _filters.remove(t);
                          }
                        });
                        setStateSheet(() {});
                      },
                    );
                  }).toList(),
                ),
                Row(
                  children: [
                    const Text('Inseguras'),
                    Switch(
                      value: _onlyUnsafe,
                      onChanged: (v) {
                        setState(() => _onlyUnsafe = v);
                        setStateSheet(() {});
                      },
                    ),
                  ],
                ),
                DropdownButton<String>(
                  value: _range,
                  items: const ['Todos', '7d', '4w', 'mes', 'año']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) {
                    setState(() => _range = v ?? 'Todos');
                    setStateSheet(() {});
                  },
                ),
                DropdownButton<String>(
                  value: _sort,
                  items: const ['Reciente', 'Antiguo', 'Frecuencia']
                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                      .toList(),
                  onChanged: (v) {
                    setState(() => _sort = v ?? 'Reciente');
                    setStateSheet(() {});
                  },
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _refresh();
                    },
                    child: const Text('Aplicar'),
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: const CodeMaster ProLogo(variant: LogoVariant.static),
          actions: [
            IconButton(
              icon: const Icon(Icons.filter_list),
              onPressed: _openFilterSheet,
              tooltip: 'Filtros',
            ),
          ],
          bottom: TabBar(
            controller: _tabs,
            tabs: const [Tab(text: 'Escaneados'), Tab(text: 'Generados')],
          ),
        ),
        body: TabBarView(
          controller: _tabs,
          children: [
            _buildList('scanned'),
            _buildList('generated'),
          ],
        ),
      ),
    );
  }

  Widget _buildList(String kind) {
    return ValueListenableBuilder(
        valueListenable: box.listenable(),
        builder: (context, dynamic value, _) {
          final rawItems = box.toMap().entries.toList();
          var items = rawItems.reversed
              .where((e) => (e.value['kind'] ?? 'scanned') == kind)
              .toList();
          final topAll = List<Map>.from(rawItems.map((e) => Map.from(e.value)))
            ..sort((a, b) => (b['count'] ?? 0).compareTo(a['count'] ?? 0));
          final suggestions = topAll.take(3).map((e) => e['code'].toString()).toList();
          final counts = rawItems.map((e) {
            final m = Map.from(e.value);
            return m['count'] ?? 1;
          }).toList();
          final maxCount = counts.isEmpty ? 0 : counts.reduce((a, b) => a > b ? a : b);
          if (items.isEmpty) {
            return ListView.builder(
              itemCount: 3,
              itemBuilder: (context, index) => Padding(
                padding: const EdgeInsets.all(16),
                child: Shimmer.fromColors(
                  baseColor: Colors.grey.shade300,
                  highlightColor: Colors.grey.shade100,
                  child: Container(
                    height: 20,
                    color: Colors.grey.shade300,
                  ),
                ),
              ),
            );
          }
          final daily = kind == 'scanned' ? StatsHelper.getDailyCounts(7) : {};
          final weekly =
              kind == 'scanned' ? StatsHelper.getWeeklyCounts(4) : {};
          final modes = kind == 'scanned' ? StatsHelper.getModeCounts() : {};
          if (_filters.isNotEmpty) {
            items = items.where((e) {
              final t = (e.value as Map)['type'] ?? 'text';
              return _filters.contains(t);
            }).toList();
          }
          if (_onlyUnsafe) {
            items = items.where((e) => !(e.value['safe'] ?? true)).toList();
          }
          if (_range != 'Todos') {
            final now = DateTime.now();
            DateTime limit;
            switch (_range) {
              case '7d':
                limit = now.subtract(const Duration(days: 7));
                break;
              case '4w':
                limit = now.subtract(const Duration(days: 28));
                break;
              case 'mes':
                limit = DateTime(now.year, now.month, 1);
                break;
              case 'año':
                limit = DateTime(now.year, 1, 1);
                break;
              default:
                limit = DateTime(1970);
            }
            items = items.where((e) {
              final d = DateTime.tryParse((e.value as Map)['lastDate'] ?? '') ?? now;
              return d.isAfter(limit);
            }).toList();
          }
          if (_searchController.text.isNotEmpty) {
            final q = _searchController.text.toLowerCase();
            items = items
                .where((e) =>
                    (e.value['code'] ?? '').toString().toLowerCase().contains(q))
                .toList();
          }
          switch (_sort) {
            case 'Antiguo':
              items.sort((a, b) {
                final ad = DateTime.tryParse(a.value['lastDate'] ?? '') ?? DateTime.now();
                final bd = DateTime.tryParse(b.value['lastDate'] ?? '') ?? DateTime.now();
                return ad.compareTo(bd);
              });
              break;
            case 'Frecuencia':
              items.sort((a, b) => (b.value['count'] ?? 0).compareTo(a.value['count'] ?? 0));
              break;
            default:
              items.sort((a, b) {
                final ad = DateTime.tryParse(a.value['lastDate'] ?? '') ?? DateTime.now();
                final bd = DateTime.tryParse(b.value['lastDate'] ?? '') ?? DateTime.now();
                return bd.compareTo(ad);
              });
          }
          final top = List<Map>.from(items.map((e) => Map.from(e.value)))
            ..sort((a, b) => (b['count'] ?? 0).compareTo(a['count'] ?? 0));
          final top3 = top.take(3).toList();
          final pending = items.any((e) => e.value['pending'] == true);
          final maxDaily = daily.values.isEmpty
              ? 1
              : daily.values.reduce((a, b) => a > b ? a : b);
          final maxWeekly = weekly.values.isEmpty
              ? 1
              : weekly.values.reduce((a, b) => a > b ? a : b);
          return Column(
            children: [
              ValueListenableBuilder<bool>(
                valueListenable: offlineNotifier,
                builder: (context, off, _) => off
                    ? const ColoredBox(
                        color: Colors.amber,
                        child: Padding(
                          padding: EdgeInsets.all(4),
                          child: Text(
                            '⚠️ Sin conexión – verificación deshabilitada',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.black),
                          ),
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async => _refresh(),
                  child: ListView.builder(
                    itemCount: items.length + 1,
                    itemBuilder: (context, index) {
                if (index == 0) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Autocomplete<String>(
                                    optionsBuilder: (t) {
                                      if (t.text.isEmpty) return const Iterable<String>.empty();
                                      return suggestions.where((s) => s.toLowerCase().contains(t.text.toLowerCase()));
                                    },
                                    onSelected: (s) {
                                      _searchController.text = s;
                                      setState(() {});
                                    },
                                    fieldViewBuilder: (ctx, controller, node, onSubmit) {
                                      controller.text = _searchController.text;
                                      return TextField(
                                        controller: controller,
                                        focusNode: node,
                                        decoration: const InputDecoration(hintText: 'Buscar'),
                                        onChanged: (v) {
                                          _searchController.text = v;
                                          setState(() {});
                                        },
                                      );
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Wrap(
                                    spacing: 4,
                                    children: [
                                      FilterChip(
                                        label: const Text('Todos'),
                                        selected: _filters.isEmpty,
                                        onSelected: (_) {
                                          setState(() => _filters.clear());
                                        },
                                      ),
                                      'url',
                                      'wifi',
                                      'contact',
                                      'tel',
                                      'sms',
                                      'geo',
                                      'email',
                                      'event',
                                      'text'
                                    ].map((t) {
                                      final selected = _filters.contains(t);
                                      return FilterChip(
                                        label: Text(t),
                                        selected: selected,
                                        onSelected: (v) {
                                          setState(() {
                                            if (v) {
                                              _filters.add(t);
                                            } else {
                                              _filters.remove(t);
                                            }
                                          });
                                        },
                                      );
                                    }).toList(),
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                DropdownButton<String>(
                                  value: _range,
                                  items: const ['Todos', '7d', '4w', 'mes', 'año']
                                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                                      .toList(),
                                  onChanged: (v) => setState(() => _range = v ?? 'Todos'),
                                ),
                                const SizedBox(width: 8),
                                DropdownButton<String>(
                                  value: _sort,
                                  items: const ['Reciente', 'Antiguo', 'Frecuencia']
                                      .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                                      .toList(),
                                  onChanged: (v) => setState(() => _sort = v ?? 'Reciente'),
                                ),
                                const SizedBox(width: 8),
                                Row(
                                  children: [
                                    Switch(
                                      value: _onlyUnsafe,
                                      onChanged: (v) => setState(() => _onlyUnsafe = v),
                                    ),
                                    const Text('Inseguras'),
                                  ],
                                )
                              ],
                            ),
                          ],
                        ),
                      ),
                      ListTile(
                        title: Text('Total códigos: ${items.length}'),
                        trailing: pending ? const Icon(Icons.sync_problem, color: Colors.red) : const Icon(Icons.check, color: Colors.green),
                        subtitle: maxCount > 0 ? Text('Más escaneado: $maxCount veces') : null,
                      ),
                      if (kind == 'scanned')
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: RepaintBoundary(
                            key: _statsKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                              const Text('Últimos 7 días'),
                              const SizedBox(height: 8),
                              SizedBox(
                                height: 120,
                                child: LineChart(
                                  LineChartData(
                                    lineBarsData: [
                                      LineChartBarData(
                                        spots: [
                                          for (int i = 0; i < daily.length; i++)
                                            FlSpot(i.toDouble(), daily.values.elementAt(i).toDouble()),
                                        ],
                                        isCurved: true,
                                        barWidth: 2,
                                        dotData: FlDotData(show: false),
                                        color: Theme.of(context).colorScheme.primary,
                                      )
                                    ],
                                    titlesData: FlTitlesData(show: false),
                                    gridData: FlGridData(show: false),
                                    borderData: FlBorderData(show: false),
                                    minY: 0,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 16),
                            const Text('Últimas 4 semanas'),
                            const SizedBox(height: 8),
                            SizedBox(
                              height: 120,
                              child: BarChart(
                                BarChartData(
                                  barGroups: [
                                    for (int i = 0; i < weekly.length; i++)
                                      BarChartGroupData(x: i, barRods: [
                                        BarChartRodData(
                                          toY: weekly.values.elementAt(i).toDouble(),
                                          color: Theme.of(context).colorScheme.secondary,
                                          width: 14,
                                        )
                                      ])
                                  ],
                                  borderData: FlBorderData(show: false),
                                  titlesData: FlTitlesData(show: false),
                                  gridData: FlGridData(show: false),
                                  barTouchData: BarTouchData(enabled: true),
                                  minY: 0,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text('Uso por modo'),
                            const SizedBox(height: 8),
                            SizedBox(
                              height: 150,
                              child: PieChart(
                                PieChartData(
                                  sectionsSpace: 2,
                                  centerSpaceRadius: 24,
                                  sections: [
                                    for (final entry in modes.entries)
                                      PieChartSectionData(
                                        value: entry.value.toDouble(),
                                        title: '${entry.key}',
                                        radius: 40,
                                      ),
                                  ],
                                ),
                              ),
                            ),
                            if (top3.isNotEmpty) ...[
                              const SizedBox(height: 16),
                              const Text('Top 3 códigos'),
                              Column(
                                children: top3.map((m) => ListTile(
                                      title: Text(m['code']),
                                      trailing: Text('×${m['count']}'),
                                    )).toList(),
                              ),
                            ]
                          ],
                        ),
                      ),
                      if (kind == 'scanned')
                        TextButton.icon(
                          onPressed: _exportStats,
                          icon: const Icon(Icons.picture_as_pdf),
                          label: const Text('Exportar gráficos'),
                        ),
                    ],
                  );
                }
                final entry = items[index - 1];
                final Map data = Map.from(entry.value);
                final first = DateTime.tryParse(data['firstDate'] ?? '') ?? DateTime.now();
                final last = DateTime.tryParse(data['lastDate'] ?? '') ?? DateTime.now();
                final count = data['count'] ?? 1;
                final bool safe = data['safe'] ?? true;
                return ListTile(
                  leading: _iconForType(data['type'] ?? 'text'),
                  title: Text(data['code'] ?? ''),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${first.toLocal().toString().split(' ').first} → ${last.toLocal().toString().split(' ').first} | Usado $count veces',
                    ),
                    if (data['checkTs'] != null)
                      Text(
                        'Verificada hace ${DateTime.now().difference(DateTime.tryParse(data['checkTs']) ?? DateTime.now()).inDays} días',
                        style: const TextStyle(fontSize: 12),
                      ),
                    if (!safe)
                      Text('⚠️ ahora insegura',
                          style: TextStyle(color: Theme.of(context).colorScheme.error)),
                      if (data['translation'] != null)
                        const Text('📘 traducido'),
                      if (maxCount > 1)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: LinearProgressIndicator(
                            value: count / maxCount,
                            minHeight: 4,
                          ),
                        ),
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (maxCount > 0 && count == maxCount && maxCount > 1)
                        Icon(Icons.star, color: Theme.of(context).colorScheme.secondary),
                      IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Eliminar'),
                              content: const Text('¿Eliminar esta entrada?'),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, false),
                                  child: const Text('Cancelar'),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  child: const Text('Eliminar'),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            box.delete(entry.key);
                          }
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.share),
                        onPressed: () => _shareEntry(data['code'] ?? ''),
                      ),
                      if (Uri.tryParse(data['code'] ?? '')?.hasScheme ?? false)
                        IconButton(
                          icon: const Icon(Icons.open_in_browser),
                          onPressed: () async {
                            bool open = true;
                            if (confirmOpenNotifier.value || !safe) {
                              open = await _confirmOpenUrl(data['code'], safe);
                            }
                            if (open) {
                              await launchUrl(Uri.parse(data['code']));
                            }
                          },
                        ),
                      Text('×$count'),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
