/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../../../../output/output_ast';
import * as ir from '../../ir';
export function phaseNullishCoalescing(job) {
    for (const unit of job.units) {
        for (const op of unit.ops()) {
            ir.transformExpressionsInOp(op, expr => {
                if (!(expr instanceof o.BinaryOperatorExpr) ||
                    expr.operator !== o.BinaryOperator.NullishCoalesce) {
                    return expr;
                }
                const assignment = new ir.AssignTemporaryExpr(expr.lhs.clone(), job.allocateXrefId());
                const read = new ir.ReadTemporaryExpr(assignment.xref);
                // TODO: When not in compatibility mode for TemplateDefinitionBuilder, we can just emit
                // `t != null` instead of including an undefined check as well.
                return new o.ConditionalExpr(new o.BinaryOperatorExpr(o.BinaryOperator.And, new o.BinaryOperatorExpr(o.BinaryOperator.NotIdentical, assignment, o.NULL_EXPR), new o.BinaryOperatorExpr(o.BinaryOperator.NotIdentical, read, new o.LiteralExpr(undefined))), read.clone(), expr.rhs);
            }, ir.VisitorContextFlag.None);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbGlzaF9jb2FsZXNjaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXIvc3JjL3RlbXBsYXRlL3BpcGVsaW5lL3NyYy9waGFzZXMvbnVsbGlzaF9jb2FsZXNjaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sS0FBSyxDQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDbkQsT0FBTyxLQUFLLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFJL0IsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEdBQW1CO0lBQ3hELEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtRQUM1QixLQUFLLE1BQU0sRUFBRSxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUMzQixFQUFFLENBQUMsd0JBQXdCLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNyQyxJQUFJLENBQUMsQ0FBQyxJQUFJLFlBQVksQ0FBQyxDQUFDLGtCQUFrQixDQUFDO29CQUN2QyxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFO29CQUN0RCxPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RixNQUFNLElBQUksR0FBRyxJQUFJLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXZELHVGQUF1RjtnQkFDdkYsK0RBQStEO2dCQUMvRCxPQUFPLElBQUksQ0FBQyxDQUFDLGVBQWUsQ0FDeEIsSUFBSSxDQUFDLENBQUMsa0JBQWtCLENBQ3BCLENBQUMsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUNwQixJQUFJLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUNoRixJQUFJLENBQUMsQ0FBQyxrQkFBa0IsQ0FDcEIsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQzNFLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFDWixJQUFJLENBQUMsR0FBRyxDQUNYLENBQUM7WUFDSixDQUFDLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2hDO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vLi4vLi4vLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0ICogYXMgaXIgZnJvbSAnLi4vLi4vaXInO1xuaW1wb3J0IHR5cGUge0NvbXBpbGF0aW9uSm9ifSBmcm9tICcuLi9jb21waWxhdGlvbic7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHBoYXNlTnVsbGlzaENvYWxlc2Npbmcoam9iOiBDb21waWxhdGlvbkpvYik6IHZvaWQge1xuICBmb3IgKGNvbnN0IHVuaXQgb2Ygam9iLnVuaXRzKSB7XG4gICAgZm9yIChjb25zdCBvcCBvZiB1bml0Lm9wcygpKSB7XG4gICAgICBpci50cmFuc2Zvcm1FeHByZXNzaW9uc0luT3Aob3AsIGV4cHIgPT4ge1xuICAgICAgICBpZiAoIShleHByIGluc3RhbmNlb2Ygby5CaW5hcnlPcGVyYXRvckV4cHIpIHx8XG4gICAgICAgICAgICBleHByLm9wZXJhdG9yICE9PSBvLkJpbmFyeU9wZXJhdG9yLk51bGxpc2hDb2FsZXNjZSkge1xuICAgICAgICAgIHJldHVybiBleHByO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXNzaWdubWVudCA9IG5ldyBpci5Bc3NpZ25UZW1wb3JhcnlFeHByKGV4cHIubGhzLmNsb25lKCksIGpvYi5hbGxvY2F0ZVhyZWZJZCgpKTtcbiAgICAgICAgY29uc3QgcmVhZCA9IG5ldyBpci5SZWFkVGVtcG9yYXJ5RXhwcihhc3NpZ25tZW50LnhyZWYpO1xuXG4gICAgICAgIC8vIFRPRE86IFdoZW4gbm90IGluIGNvbXBhdGliaWxpdHkgbW9kZSBmb3IgVGVtcGxhdGVEZWZpbml0aW9uQnVpbGRlciwgd2UgY2FuIGp1c3QgZW1pdFxuICAgICAgICAvLyBgdCAhPSBudWxsYCBpbnN0ZWFkIG9mIGluY2x1ZGluZyBhbiB1bmRlZmluZWQgY2hlY2sgYXMgd2VsbC5cbiAgICAgICAgcmV0dXJuIG5ldyBvLkNvbmRpdGlvbmFsRXhwcihcbiAgICAgICAgICAgIG5ldyBvLkJpbmFyeU9wZXJhdG9yRXhwcihcbiAgICAgICAgICAgICAgICBvLkJpbmFyeU9wZXJhdG9yLkFuZCxcbiAgICAgICAgICAgICAgICBuZXcgby5CaW5hcnlPcGVyYXRvckV4cHIoby5CaW5hcnlPcGVyYXRvci5Ob3RJZGVudGljYWwsIGFzc2lnbm1lbnQsIG8uTlVMTF9FWFBSKSxcbiAgICAgICAgICAgICAgICBuZXcgby5CaW5hcnlPcGVyYXRvckV4cHIoXG4gICAgICAgICAgICAgICAgICAgIG8uQmluYXJ5T3BlcmF0b3IuTm90SWRlbnRpY2FsLCByZWFkLCBuZXcgby5MaXRlcmFsRXhwcih1bmRlZmluZWQpKSksXG4gICAgICAgICAgICByZWFkLmNsb25lKCksXG4gICAgICAgICAgICBleHByLnJocyxcbiAgICAgICAgKTtcbiAgICAgIH0sIGlyLlZpc2l0b3JDb250ZXh0RmxhZy5Ob25lKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==