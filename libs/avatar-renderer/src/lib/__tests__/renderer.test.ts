import { stripSvgWrapper, compositeAvatar } from '../renderer';

describe('stripSvgWrapper', () => {
  it('strips <svg> opening tag regardless of attribute order', () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" fill="none"><rect/></svg>';
    const result = stripSvgWrapper(input);
    expect(result).not.toMatch(/^<svg/);
    expect(result).toContain('<rect/>');
  });

  it('strips opening tag with attributes in different order', () => {
    const input = '<svg fill="none" width="512" height="512"><path d="M0"/></svg>';
    const result = stripSvgWrapper(input);
    expect(result).not.toMatch(/^<svg/);
    expect(result).toContain('<path d="M0"/>');
  });

  it('strips closing </svg>', () => {
    const input = '<svg><g></g></svg>';
    const result = stripSvgWrapper(input);
    expect(result).not.toContain('</svg>');
    expect(result).toContain('<g></g>');
  });

  it('handles empty string', () => {
    expect(stripSvgWrapper('')).toBe('');
  });

  it('strips only the outermost svg tags', () => {
    const input = '<svg width="512"><g><svg nested="true"/></g></svg>';
    const result = stripSvgWrapper(input);
    // The outermost opening tag should be gone
    expect(result).not.toMatch(/^<svg/);
    // Nested svg should still be present
    expect(result).toContain('<svg nested="true"/>');
  });
});

describe('compositeAvatar', () => {
  it('wraps layers in a 512x512 svg element', () => {
    const result = compositeAvatar(['<rect/>', '<circle/>']);
    expect(result).toContain('width="512"');
    expect(result).toContain('height="512"');
    expect(result).toMatch(/^<svg/);
    expect(result).toMatch(/<\/svg>$/);
  });

  it('contains the layer content', () => {
    const result = compositeAvatar(['<rect/>', '<circle/>']);
    expect(result).toContain('<rect/>');
    expect(result).toContain('<circle/>');
  });

  it('skips empty layers', () => {
    const result = compositeAvatar(['<rect/>', '', '<circle/>']);
    // Should still have both non-empty layers
    expect(result).toContain('<rect/>');
    expect(result).toContain('<circle/>');
    // Empty string should not add extra content (no double adjacent markers)
    expect(result).not.toContain('""');
  });

  it('produces valid svg with empty layer list', () => {
    const result = compositeAvatar([]);
    expect(result).toMatch(/^<svg/);
    expect(result).toMatch(/<\/svg>$/);
  });
});
