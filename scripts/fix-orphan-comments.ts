import { prisma } from '../src/lib/prisma';

/**
 * 유령 댓글 복구 스크립트
 *
 * 3단 이상 댓글(parentId가 있는 댓글의 답글)을 찾아서
 * 최상위 조상으로 parentId를 변경하여 2단 구조로 평탄화합니다.
 *
 * 실행 방법:
 * npx tsx scripts/fix-orphan-comments.ts
 */

async function fixOrphanComments() {
  console.log('🔍 유령 댓글 검색 시작...\n');

  // 1. 모든 댓글 조회
  const allComments = await prisma.comment.findMany({
    select: {
      id: true,
      parentId: true,
      content: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📊 전체 댓글 수: ${allComments.length}`);

  // 2. parentId로 댓글 맵 생성
  const commentMap = new Map(allComments.map(c => [c.id, c]));

  // 3. 3단 이상 댓글 찾기
  const orphanComments: Array<{
    id: string;
    currentParentId: string;
    newParentId: string;
    depth: number;
  }> = [];

  for (const comment of allComments) {
    if (!comment.parentId) continue; // 최상위 댓글은 건너뜀

    const parent = commentMap.get(comment.parentId);
    if (!parent) {
      console.warn(`⚠️  부모를 찾을 수 없는 댓글: ${comment.id} (parentId: ${comment.parentId})`);
      continue;
    }

    if (parent.parentId) {
      // 부모가 이미 답글이면 = 3단 이상
      // 최상위 조상 찾기
      let ancestor = parent;
      let depth = 2;
      while (ancestor.parentId) {
        const next = commentMap.get(ancestor.parentId);
        if (!next) break;
        ancestor = next;
        depth++;
      }

      orphanComments.push({
        id: comment.id,
        currentParentId: comment.parentId,
        newParentId: ancestor.id,
        depth,
      });
    }
  }

  console.log(`\n🔎 발견된 유령 댓글(3단 이상): ${orphanComments.length}개\n`);

  if (orphanComments.length === 0) {
    console.log('✅ 복구할 유령 댓글이 없습니다.');
    return;
  }

  // 4. 깊이별 통계
  const depthStats = new Map<number, number>();
  orphanComments.forEach(o => {
    depthStats.set(o.depth, (depthStats.get(o.depth) || 0) + 1);
  });

  console.log('📈 깊이별 통계:');
  Array.from(depthStats.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([depth, count]) => {
      console.log(`   ${depth}단: ${count}개`);
    });

  // 5. 복구 실행 (Dry run 확인)
  console.log('\n⚠️  복구를 실행하시겠습니까?');
  console.log('   이 작업은 댓글의 parentId를 최상위 조상으로 변경합니다.');
  console.log('   실행하려면 이 스크립트를 수정하여 dryRun을 false로 설정하세요.\n');

  const dryRun = true; // 실제 실행하려면 false로 변경

  if (dryRun) {
    console.log('🔒 DRY RUN 모드: 실제 변경은 하지 않습니다.\n');
    orphanComments.slice(0, 5).forEach((o, idx) => {
      console.log(`${idx + 1}. ID: ${o.id.slice(0, 8)}... (${o.depth}단)`);
      console.log(`   현재 부모: ${o.currentParentId.slice(0, 8)}...`);
      console.log(`   새 부모:   ${o.newParentId.slice(0, 8)}...`);
    });
    if (orphanComments.length > 5) {
      console.log(`   ... 외 ${orphanComments.length - 5}개`);
    }
  } else {
    console.log('🔧 복구 시작...\n');
    let updatedCount = 0;

    for (const orphan of orphanComments) {
      try {
        await prisma.comment.update({
          where: { id: orphan.id },
          data: { parentId: orphan.newParentId },
        });
        updatedCount++;
        if (updatedCount % 10 === 0) {
          console.log(`   진행: ${updatedCount}/${orphanComments.length}`);
        }
      } catch (error) {
        console.error(`❌ 복구 실패 (ID: ${orphan.id}):`, error);
      }
    }

    console.log(`\n✅ 복구 완료: ${updatedCount}/${orphanComments.length}개 댓글 수정됨`);
  }
}

fixOrphanComments()
  .catch(error => {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
