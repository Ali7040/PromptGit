import { DiffService } from './diff.service';

describe('DiffService', () => {
  const service = new DiffService({} as any);

  it('identical content → all equal', () => {
    const res = service['computeDiff']('a\nb', 'a\nb');
    expect(res.length).toBe(2);
    expect(res.every(l => l.type === 'equal')).toBe(true);
  });

  it('empty from → all inserts', () => {
    const res = service['computeDiff']('', 'a\nb');
    expect(res.length).toBe(2);
    expect(res.every(l => l.type === 'insert')).toBe(true);
  });

  it('empty to → all deletes', () => {
    const res = service['computeDiff']('a\nb', '');
    expect(res.length).toBe(2);
    expect(res.every(l => l.type === 'delete')).toBe(true);
  });

  it('completely different → delete + insert', () => {
    const res = service['computeDiff']('a\nb', 'x\ny');
    expect(res.some(l => l.type === 'delete')).toBe(true);
    expect(res.some(l => l.type === 'insert')).toBe(true);
  });

  it('stats match line count', () => {
    const res = service['computeDiff']('a\nb', 'a\nc');

    const stats = {
      added: res.filter(l => l.type === 'insert').length,
      removed: res.filter(l => l.type === 'delete').length,
      unchanged: res.filter(l => l.type === 'equal').length,
    };

    expect(stats.added + stats.removed + stats.unchanged).toBe(res.length);
  });
});
